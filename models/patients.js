const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Patients Schema
const PatientsSchema = new Schema(
  {
    bsn: [{ type: Schema.Types.ObjectId, ref: "BSN" }],
    name: String,
    birthdate: Date,
    history: Array,
    healthcareworker: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Home", "Hospitalized", "IC", "Deceased", "Recovered"],
      required: true,
    },
    region: {
      type: String,
      enum: [
        "Dienst Gezondheid & Jeugd Zuid-Holland Zuid",
        "GGD Amsterdam",
        "GGD Brabant-Zuidoost",
        "GGD Drenthe",
        "GGD Fryslan",
        "GGD Gelderland-Zuid",
        "GGD Gooi en Vechtstreek",
        "GGD Groningen",
        "GGD Haaglanden",
        "GGD Hart voor Brabant",
        "GGD Hollands-Midden",
        "GGD Hollands-Noorden",
        "GGD IJsselland",
        "GGD Kennemerland",
        "GGD Limburg-Noord",
        "GGD Noord- en Oost-Gelderland",
        "GGD regio Utrecht",
        "GGD Rotterdam-Rijnmond",
        "GGD Twente",
        "GGD West-Brabant",
        "GGD Zaanstreek-Waterland",
        "GGD Zeeland",
        "GGD Zuid-Limburg",
        "Veiligheids- en Gezondheidsregio Gelderland-Midden",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const Patients = mongoose.model("Patients", PatientsSchema);
module.exports = Patients;
