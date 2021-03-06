// Modal for delete button userlist

const $userlist = document.getElementById("userlist");
const $deleteModal = document.getElementById("delete-modal");
const $deleteUser = document.getElementById("user");

if ($userlist) {
  $userlist.addEventListener("click", (event) => {
    console.log(event.target.className);
    if (event.target.className === "fa fa-trash") {
      console.log(event.target);
      const dataDeleteID = event.target.parentElement.getAttribute("data-delete-id");
      const dataDeleteUser = event.target.parentElement.getAttribute("data-username");
      console.log(dataDeleteUser);
      $deleteModal.href = dataDeleteID;
      $deleteUser.innerText = dataDeleteUser;
    }
  });
}


// NAV BAR TOGGLE MENU
let mainNav = document.getElementById("js-menu");
let navBarToggle = document.getElementById("js-navbar-toggle");

if (mainNav && navBarToggle) {
  navBarToggle.addEventListener("click", function () {
    mainNav.classList.toggle("active");
  });
}

// Password strength

const strength = {
  0: "Worst ☹",
  1: "Bad ☹",
  2: "Weak ☹",
  3: "Good ☺",
  4: "Strong ☻",
};

const username = document.getElementById("username");
const passwordold = document.getElementById("passwordold");
const password1 = document.getElementById("passwordnew1");
const password2 = document.getElementById("passwordnew2");
const meter = document.getElementById("password-strength-meter");
const text = document.getElementById("password-strength-text");

if (password1) {
  password1.addEventListener("input", () => {
    let val = password1.value;
    let result = zxcvbn(val);

    // Update the password strength meter
    meter.value = result.score;

    // Update the text indicator
    if (val !== "") {
      text.innerHTML =
        "Strength: " +
        "<strong>" +
        strength[result.score] +
        "</strong>" +
        "<span class='feedback'>" +
        result.feedback.warning +
        " " +
        result.feedback.suggestions +
        "</span";
    } else {
      text.innerHTML = "";
    }
  });
}


// Compare the new passwords
const submitNewPassword = document.getElementById("submitNewPassword");
const passwordError = document.getElementById("passwordError")

if (submitNewPassword) {
  submitNewPassword.addEventListener("click", (event) => {
    event.preventDefault();
    passwordError.style.display = 'none'
    passwordError.innerHTML = '';
    
    if (password1.value.length < 8) {
    passwordError.style.display = 'block';
    passwordError.innerHTML = 'New password has to be at least 8 characters long'
    }
    else {
    if (password1.value !== password2.value ) {
      passwordError.style.display = 'block';
      passwordError.innerHTML = 'New passwords are not the same';
    } else {
      document.forms["newPasswordForm"].submit();
    }
  }
  });
}



