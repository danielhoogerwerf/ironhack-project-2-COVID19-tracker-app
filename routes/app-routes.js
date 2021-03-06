// Module declarations
const express = require("express");
const mobileAppRouter = express.Router();
const ensureLogin = require("connect-ensure-login");
const passport = require("passport");
const moment = require("moment");
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// checkRoles middleware
const checkRoles = require("../auth/checkRoles");
const generatePassword = require("../auth/generatePassword");
const mailPassword = require("../auth/mailPassword");
const checkPassword = require("../auth/checkPassword");

// Models declarations
const Users = require("../models/users");
const BSN = require("../models/bsn");
const Patients = require("../models/patients");

// ## LOGIN PROCESS ##

// GET route Login page app
mobileAppRouter.get("/", (req, res, next) => {
  res.render("app/app-login", { message: req.flash("error") });
});

// POST route Login page app
mobileAppRouter.post(
  "/",
  checkPassword(),
  passport.authenticate("local", {
    successRedirect: "/app/home",
    failureRedirect: "/app",
    failureFlash: true,
  })
);

// POST route for forgot password
mobileAppRouter.post("/password", (req, res, next) => {
  Users.find({ username: req.body.username })
    .then((user) => {
      mailPassword(user[0]._id, req.body.username);
      res.render("app/app-login");
    })
    .catch((err) => console.log(err));
});

// POST route for new password
mobileAppRouter.post("/newpassword", (req, res, next) => {
  Users.findOne({ username: req.body.username })
    .then((user) => {
      // Check of old passwords match
      bcrypt.compare(req.body.passwordold, user.password, (err, same) => {
        if (!same) {
          console.log("password not correct");
          const errorMessage = "Incorrect password";
          res.render("app/app-login-change-password", { errorMessage: errorMessage, user: user.username });
        } else {
          const salt = bcrypt.genSaltSync(bcryptSalt);
          const hashPass = bcrypt.hashSync(req.body.passwordnew1, salt);
          Users.findOneAndUpdate(
            { username: req.body.username },
            { password: hashPass, passwordflag: false },
            { new: true }
          ).then((user) => {
            console.log("password was updated from user:", user);
            res.redirect("/app");
          });
        }
      });
    })
    .catch((err) => console.log(err));
});

// ## HOME SCREEN ##

// GET route home page
mobileAppRouter.get("/home", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  res.render("app/app-home", { currentUser: req.user });
});

// ## SIGN UP PROCESS ##

// INTERNAL USE -- GET route BSN SignUp
mobileAppRouter.get("/signup/bsn-internal", checkRoles("ADMIN"), (req, res, next) => {
  res.render("app/signup/app-signup-bsn-internal");
});

// INTERNAL USE -- POST route BSN SignUp
mobileAppRouter.post("/signup/bsn-internal", checkRoles("ADMIN"), (req, res, next) => {
  const { bsn, name, birthdate, gender } = req.body;
  BSN.create({
    bsnnumber: bsn,
    name: name,
    birthdate: birthdate,
    gender: gender,
  })
    .then(() => {
      res.send("Done");
    })
    .catch((err) => next(err));
});

// Step 1 - GET route Lookup person page
mobileAppRouter.get("/signup", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  res.render("app/signup/app-signup-lookup-person");
});

// POST route Lookup person page
mobileAppRouter.post("/signup/lookup", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  let { birthdate } = req.body;
  let { name } = req.body;
  if (!name) {
    name = "NoNameEntered!";
  }
  if (!birthdate) {
    birthdate = "1111/01/01";
  }

  BSN.find({
    $or: [
      { $and: [{ name: { $ne: null } }, { name: { $regex: ".*?" + name, $options: "i" } }] },
      { birthdate: birthdate },
    ],
  }).then((data) => {
    res.render("app/signup/app-signup-lookup-person-result", { results: data });
  });
});

// Step 2 - GET route Lookup already patient
mobileAppRouter.get("/signup/lookup/:id", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  let patientIsRegistered;
  Patients.find({ bsn: req.params.id })
    .populate("bsn")
    .populate("healthcareworker")
    .then((patientsResults) => {
      if (patientsResults[0] !== undefined) {
        patientIsRegistered = patientsResults[0].status;
      }
    })
    .then(() => {
      BSN.findById(req.params.id)
        .then((bsnResults) => {
          if (patientIsRegistered) {
            res.render("app/signup/app-signup-lookup-person-result", { bsnResults, patientIsRegistered });
          } else {
            const momentDate = moment(bsnResults.birthdate).format("YYYY-MM-DD");
            res.render("app/signup/app-signup-patient", { bsnResults, formattedDate: momentDate });
          }
        })
        .catch((e) => next(e));
    })
    .catch((e) => next(e));
});

// Step 3 - GET route SignUp page
mobileAppRouter.get("/signup/patient", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  res.render("app/signup/app-signup-patient");
});

// POST route SignUp page
mobileAppRouter.post("/signup/patient", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  patient = JSON.parse(JSON.stringify(req.body));
  res.render("app/signup/app-signup-confirmation", { patient });
});

// Step 4 - POST route Confirmation page
mobileAppRouter.post("/signup/confirmation", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  const { name, birthdate, region, gender, bsnnumber, status } = req.body;
  BSN.create({
    bsnnumber: bsnnumber,
    name: name,
    birthdate: birthdate,
    gender: gender,
  })
    .then((bsn) => {
      Patients.create({
        bsn: bsn._id,
        history: { Status: status, Date: new Date() },
        healthcareworker: req.user.id,
        status: status,
        region: region,
      });
    })
    .then(() => {
      res.render("app/signup/app-signup-registration-complete");
    })
    .catch((err) => res.render("app/signup/app-signup-registration-fail", { err }));
});

// ## LOOKUP PATIENT PROCESS ##

// GET route Lookup patient page
mobileAppRouter.get("/lookup/patient", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  let userRegion = { region: req.user.region };
  if (req.user.role === "ADMIN") {
    userRegion = {};
  }
  Patients.find(userRegion)
    .populate("bsn")
    .populate("healthcareworker")
    .then((results) => {
      res.render("app/lookup/app-lookup-patient", {
        results,
        currentUser: req.user.username,
        currentRegion: req.user.region,
      });
    })
    .catch((e) => next(e));
});

// POST route Lookup patient page
mobileAppRouter.post("/lookup/patient", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  let { birthdate } = req.body;
  let { name } = req.body;
  if (!name) {
    name = "NoNameEntered!";
  }
  if (!birthdate) {
    birthdate = "1111/01/01";
  }
  Patients.aggregate([
    {
      $lookup: {
        from: "bsns",
        localField: "bsn",
        foreignField: "_id",
        as: "bsn",
      },
    },
    {
      $match: {
        $or: [{ "bsn.name": new RegExp(".*" + name, "i") }, { "bsn.birthdate": new Date(birthdate) }],
      },
    },
    {
      $unwind: {
        path: "$bsn",
      },
    },
    {
      $project: {
        _id: 0,
        "bsn.name": 1,
        "bsn.birthdate": 1,
        "bsn.gender": 1,
        "bsn.bsnnumber": 1,
        "bsn.id": {
          $toString: "$bsn._id",
        },
      },
    },
  ])
    .then((data) => {
      res.render("app/lookup/app-lookup-results-patient", { results: data });
    })
    .catch((e) => next(e));
});

// GET route Lookup by ID
mobileAppRouter.get("/lookup/patient/:id", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  // Pay attention that the references defined in Patients model match the mongoose.model("") of BSN and User
  Patients.find({ bsn: req.params.id })
    .populate("bsn")
    .populate("healthcareworker")
    .then((data) => {
      res.render("app/lookup/app-selected-patient", { results: data });
    });
});

// GET route Edit Patient
mobileAppRouter.get("/lookup/patient/:id/edit", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  Patients.find({ bsn: req.params.id })
    .populate("bsn")
    .populate("healthcareworker")
    .then((data) => {
      res.render("app/lookup/app-edit-patient", { results: data });
    });
});

// POST route Edit Patient
mobileAppRouter.post("/lookup/patient/:id/edit", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  const { status } = req.body;
  Patients.updateOne(
    { bsn: req.params.id },
    { $set: { status: status, updatedAt: new Date() }, $addToSet: { history: [{ Status: status, Date: new Date() }] } }
  )
    .then((data) => {
      res.render("app/lookup/app-edit-patient-completed", { id: req.params.id });
    })
    .catch((err) => next(err));
});

// GET route my patient page
mobileAppRouter.get("/patients", ensureLogin.ensureLoggedIn("/app"), (req, res, next) => {
  let userRegion = { region: req.user.region };
  if (req.user.role === "ADMIN") {
    userRegion = {};
  }
  Patients.find(userRegion)
    .populate("bsn")
    .populate("healthcareworker")
    .then((results) => {
      const totalCases = results.length;
      res.render("app/app-patient-list", {
        results,
        totalCases,
        currentUser: req.user.username,
        currentRegion: req.user.region,
      });
    })
    .catch((e) => next(e));
});

// ## LOGOUT PROCESS ##

// GET logout route
mobileAppRouter.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = mobileAppRouter;
