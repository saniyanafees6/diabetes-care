//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

// const { byCode } = require("fhirclient/lib/lib");

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    let names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of medications
function displayMedication(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}
// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}
// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value:''
    },
    dia: {
      value: ''
    },
    cholestrol: {
      value:''
  },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    glucose: {
      value: ''
    },
    microalbumin: {
      value: ''
    },
    ketones: {
      value: ''
    },
    hemoglobin: {
      value: ''
    },
    familydiseasehistory: {
      value: ''
    }
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {

  height.innerHTML = obs.height;
  weight.innerHTML = obs.weight;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
  cholestrol.innerHTML = obs.cholestrol;
  ldl.innerHTML = obs.ldl;
  hdl.innerHTML = obs.hdl;
  glucose.innerHTML = obs.glucose;
  microalbumin.innerHTML = obs.microalbumin;
  ketones.innerHTML = obs.ketones;
  hemoglobin.innerHTML = obs.hemoglobin;
  familydiseasehistory.innerHTML = obe.familydiseasehistory;
}

//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {

  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      displayPatient(patient);
      console.log(patient);
    }
  );

  // get observation resoruce values
  // you will need to update the below to retrive the weight and height values
  let query = new URLSearchParams();
  let weight;

  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|8302-2', // height
    'http://loinc.org|29463-7', // weight
    'http://loinc.org|8480-6', // systolic blood pressure
    'http://loinc.org|8462-4', // diastolic blood pressure
    'http://loinc.org|2093-3', // total cholestrol
    'http://loinc.org|18262-6', // LDL
    'http://loinc.org|2085-9', // HDL
    'http://loinc.org|2339-0', // Glucose
    'http://loinc.org|14959-1', // microalbumin in Urine
    'http://loinc.org|5797-6', // ketones in urine
    'http://loinc.org|4548-4', // hemoglobin
    'http://loinc.org|55284-4', // blood pressure
    'http://loinc.org|54116-9', // family disease history
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {

      // group all of the observation resoruces by type into their own
      let byCodes = client.byCodes(ob, 'code');
      let height = byCodes('8302-2'); //height
      weight = byCodes('29463-7'); // weight
      let sys = getBloodPressureValue(byCodes('55284-4'), '8480-6'); // systolic blood pressure
      let dia = getBloodPressureValue(byCodes('55284-4'), '8462-4'); // diastolic blood pressure
      let cholestrol = byCodes('2093-3'); // total cholestrol
      let ldl = byCodes('18262-6'); // LDL
      let hdl = byCodes('2085-9'); // HDL
      let glucose = byCodes('2339-0'); // Glucose
      let microalbumin = byCodes('14959-1'); // microalbumin in Urine
      let hemoglobin = byCodes('4548-4'); // hemoglobin
      let ketones = byCodes('5797-6'); // ketones in urine
      let familydiseasehistory = byCodes('54116-9'); // family disease history

      // create patient object
      let p = defaultPatient();
      p.height = getQuantityValueAndUnit(height[0]);
      p.weight = getQuantityValueAndUnit(weight[0]);
      p.sys = sys;
      p.dia = dia;
      p.cholestrol = getQuantityValueAndUnit(cholestrol[0]);
      p.ldl = getQuantityValueAndUnit(ldl[0]);
      p.hdl = getQuantityValueAndUnit(hdl[0]);
      p.glucose = getQuantityValueAndUnit(glucose[0]);
      p.microalbumin = getQuantityValueAndUnit(microalbumin[0]);
      p.hemoglobin = getQuantityValueAndUnit(hemoglobin[0]);
      p.ketones = getQuantityValueAndUnit(ketones[0]);
      p.familydiseasehistory  = getQuantityValueAndUnit(familydiseasehistory[0])

      displayObservation(p)
    });

    let newquery = new URLSearchParams();
  newquery.set("patient", client.patient.id);
  newquery.entries("_sort", "-date");
  client.request("MedicationRequest?" + newquery, {
    pageLimit: 0, //get all pages
    flat: true //return flat array of Observation resources
  }).then(
      function(data) {
        data.forEach(function(medication){
          displayMedication(medication.medicationCodeableConcept.text);
        })
      });


}).catch(console.error);
