$(document).ready(function() {

  $(".patient-records").sortable({
    handle: ".panel-heading",
    items: "div.panel",
    tolerance: "pointer"
  });

  $('.patient-records .panel-heading span.remove').on('click', function() {

    var target = $(this).closest('.panel');

    target.fadeOut(300, function() {
      $(this).remove();
    });

  });

  $(window).scroll(function() {
    if ($(this).scrollTop() < 200) {
      $('#smoothscroll').fadeOut();
    } else {
      $('#smoothscroll').fadeIn();
    }
  });

  $('#smoothscroll').on('click', function() {
    $('html, body').animate({
      scrollTop: 0
    }, 'fast');
    return false;
  });


  var defaultSubjectId = "9999999060";

  ehrId = "dabcbf61-94bb-45df-a472-9c7a489a200d"
  var ecisUrl = "https://platform.code4health.org/ethercis/fhir/";
  var marandUrl = "https://platform.code4health.org/marand/fhir/"

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var sessionId;

  function login() {
    return $.ajax({
      type: "POST",
      url: baseUrl + "/session?" + $.param({
        username: username,
        password: password
      }),
      success: function(res) {
        sessionId = res.sessionId;
      }
    });
  }

  function logout() {
    return $.ajax({
      type: "DELETE",
      url: baseUrl + "/session",
      headers: {
        "Ehr-Session": sessionId
      }
    });
  }

  function getPatientDemographicsNHS() {
    var subjectId = defaultSubjectId
    return $.ajax({
      url: "//yellow.testlab.nhs.uk/careconnect-ri/STU3/Patient/1011",
      type: 'GET',
      success: function(data) {

//        console.log(data)

        var party = data;

        // Name
        $("#patient-name").html(party.name[0].given + ' ' + party.name[0].family);

        // Complete age
        var age = getAge(formatDateUS(party.birthDate));
        $(".patient-age").html(age);

        // Date of birth
        var date = new Date(party.birthDate);
        var stringDate = monthNames[date.getMonth()] + '. ' + date.getDate() + ', ' + date.getFullYear();
        $(".patient-dob").html(stringDate);

        // Age in years
        $(".patient-age-years").html(getAgeInYears(party.dateOfBirth));

        // Gender
        var gender = party.gender;
        $("#patient-gender").html(gender.substring(0, 1) + gender.substring(1).toLowerCase());

        //Dummy picture
        $('.patient-pic').css('background', 'url(img/' + gender.toLowerCase() + '.png)');

      }
    });
  }


  function getFhirAllergies(subjectId, cdrName) {

    var urlFhir = getFhirEndpoint(subjectId, cdrName, "AllergyIntolerance");

    return $.ajax({
      url: urlFhir,
      type: 'GET',
      cdr: cdrName,
      success: function(res) {
        var html = "";
        if (res.entry != null) {

          // console.log(res.entry[0]);

          for (var i = 0; i < res.entry.length; i++) {

             allergy = res.entry[i].resource;

            if (allergy.code != null) {

              allergyAgent = allergy.code.text;
              allergyAgentCode = getCodeableConceptCode(allergy.code);
              allergyDate = formatDate(allergy.assertedDate, false);
              manifestation = allergy.reaction[0].manifestation[0].text

              html += '<tr>';
              html += '<td>' + allergyAgent + '</td>' +
                '<td>' + allergyAgentCode + '</td>' +
                '<td>' + manifestation + '</td>' +
                '<td>' + allergyDate + '</td>' +
                '<td>' + this.cdr + '</td>'
              html += '</tr>';

            }
          }
        $("#fhirAllergies").find("tbody").append(html);

        }
      }
    });
  }

  function getFhirConditions(subjectId, cdrName) {

    var urlFhir = getFhirEndpoint(subjectId, cdrName, "Condition");

    return $.ajax({
      url: urlFhir,
      cdr: cdrName,
      type: 'GET',
      success: function(res) {

        var html = "";
        if (res.entry != null) {

          var conditionCode = "";

          for (var i = 0; i < res.entry.length; i++) {
            //  console.log(res.entry[i]);

            condition = res.entry[i].resource;

            if (condition.code != null) {

              conditionValue = condition.code.text;
              conditionCode = getCodeableConceptCode(condition.code);
              conditionDate = formatDate(condition.onsetDateTime, false);

              // conditionStatus - Currently hardwired to 'active' prior to CC profiles being published
              conditionStatus = "Inactive";

              html += '<tr>';
              html += '<td>' + conditionValue + '</td>' +
                '<td>' + conditionCode + '</td>' +
                '<td>' + conditionStatus + '</td>' +
                '<td>' + conditionDate + '</td>' +
                '<td>' + this.cdr + '</td>'
              html += '</tr>';

            }
          }
          $("#fhirConditions").find("tbody").append(html);
        }
      }
    });
  }

  function getFhirMedications(subjectId, cdrName) {

    var urlFhir = getFhirEndpoint(subjectId, cdrName, "MedicationStatement");

    return $.ajax({
      url: urlFhir,
      type: 'GET',
      cdr: cdrName,
      success: function(res) {
        var html = "";

        if (res.entry != null) {

          var medCode = ""
          for (var i = 0; i < res.entry.length; i++) {
            //    console.log(res.entry[i]);

            med = res.entry[i].resource;

            //Find the contained Medication resource
            // This is specific to openEHR systems which use contaied resources

            medicationRef = med.contained[0]
            if (medicationRef != null) {

              medValue = medicationRef.code.text;
          //    console.log(medicationRef.code);

              medCode = getCodeableConceptCode(medicationRef.code);

              medDate = formatDate(med.dateAsserted, false);
              dosage = med.dosage[0].text;

              html += '<tr>';
              html += '<td>' + medValue + '</td>' +
                '<td>' + medCode + '</td>' +
                '<td>' + dosage + '</td>' +
                '<td>' + medDate + '</td>' +
                '<td>' + this.cdr + '</td>'
              html += '</tr>';

            }
          }

          $("#fhirMeds").find("tbody").append(html);

        }
      }
    });
  }

  function getFhirProcedures(subjectId, cdrName) {

    var urlFhir = getFhirEndpoint(subjectId, cdrName, "Procedure");

    return $.ajax({
      url: urlFhir,
      type: 'GET',
      cdr: cdrName,
      success: function(res) {
        var html = "";

        if (res.entry != null) {

          var procCode = "";
          for (var i = 0; i < res.entry.length; i++) {
            procedure = res.entry[i].resource;

            // console.log(res.entry[i]);
            if (procedure.code != null) {

              procValue = procedure.code.text;
              procCode = getCodeableConceptCode(procedure.code);
              procDate = formatDate(procedure.performedDateTime, false);
              procStatus = procedure.status;

              html += '<tr>';
              html += '<td>' + procValue + '</td>' +
                '<td>' + procCode + '</td>' +
                '<td>' + procStatus + '</td>' +
                '<td>' + procDate + '</td>' +
                '<td>' + this.cdr + '</td>'
              html += '</tr>';
            }

          }

          $("#fhirProcedures").find("tbody").append(html);

        }
      }
    });
  }


  // Returns the code associated with a given codableConcept
  function getCodeableConceptCode(codeableConcept) {
    if (codeableConcept.coding != null) {
      return codeableConcept.coding[0].code;
    }
    else {
      return "";
    }
  }

  // Returns the appropriate FHIR endpoint for a particular openEHR CDR and FHIR profile
  function getFhirEndpoint(subjectId, sourceCdr, fhirResource) {
    if (sourceCdr == "Ethercis") {
      return ecisUrl + fhirResource + "?patient.identifier=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fnhs-number%7C" + subjectId;
    }
    else {
      return marandUrl + fhirResource + "?patient.identifier=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fnhs-number%7C" + subjectId;
    }
  }

  // Helper functions (dates)
  function getAge(dateString) {
    var now = new Date();
    var today = new Date(now.getYear(), now.getMonth(), now.getDate());

    var yearNow = now.getYear();
    var monthNow = now.getMonth();
    var dateNow = now.getDate();

    var dob = new Date(dateString.substring(6, 10),
      dateString.substring(0, 2) - 1,
      dateString.substring(3, 5)
    );

    var yearDob = dob.getYear();
    var monthDob = dob.getMonth();
    var dateDob = dob.getDate();
    var age = {};
    var ageString = "";
    var yearString = "";
    var monthString = "";
    var dayString = "";


    var yearAge = yearNow - yearDob;

    if (monthNow >= monthDob)
      var monthAge = monthNow - monthDob;
    else {
      yearAge--;
      var monthAge = 12 + monthNow - monthDob;
    }

    if (dateNow >= dateDob)
      var dateAge = dateNow - dateDob;
    else {
      monthAge--;
      var dateAge = 31 + dateNow - dateDob;

      if (monthAge < 0) {
        monthAge = 11;
        yearAge--;
      }
    }

    age = {
      years: yearAge,
      months: monthAge,
      days: dateAge
    };

    if (age.years > 1) yearString = "y";
    else yearString = "y";
    if (age.months > 1) monthString = "m";
    else monthString = "m";
    if (age.days > 1) dayString = " days";
    else dayString = " day";


    if ((age.years > 0) && (age.months > 0) && (age.days > 0))
      ageString = age.years + yearString + " " + age.months + monthString; // + ", and " + age.days + dayString + " old";
    else if ((age.years == 0) && (age.months == 0) && (age.days > 0))
      ageString = age.days + dayString + " old";
    else if ((age.years > 0) && (age.months == 0) && (age.days == 0))
      ageString = age.years + yearString; // + " old. Happy Birthday!";
    else if ((age.years > 0) && (age.months > 0) && (age.days == 0))
      ageString = age.years + yearString + " and " + age.months + monthString; // + " old";
    else if ((age.years == 0) && (age.months > 0) && (age.days > 0))
      ageString = age.months + monthString; // + " and " + age.days + dayString + " old";
    else if ((age.years > 0) && (age.months == 0) && (age.days > 0))
      ageString = age.years + yearString; // + " and " + age.days + dayString + " old";
    else if ((age.years == 0) && (age.months > 0) && (age.days == 0))
      ageString = age.months + monthString; // + " old";
    else ageString = "Oops! Could not calculate age!";

    return ageString;
  }

  function formatDate(date, completeDate) {

    var d = new Date(date);

    var curr_date = d.getDate();
    curr_date = normalizeDate(curr_date);

    var curr_month = d.getMonth();
    curr_month++;
    curr_month = normalizeDate(curr_month);

    var curr_year = d.getFullYear();

    var curr_hour = d.getHours();
    curr_hour = normalizeDate(curr_hour);

    var curr_min = d.getMinutes();
    curr_min = normalizeDate(curr_min);

    var curr_sec = d.getSeconds();
    curr_sec = normalizeDate(curr_sec);

    var dateString, monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (completeDate) {
      dateString = curr_date + "-" + monthNames[curr_month - 1] + "-" + curr_year + " at " + curr_hour + ":" + curr_min; // + ":" + curr_sec;
    } else dateString = curr_date + "-" + monthNames[curr_month - 1] + "-" + curr_year;

    return dateString;

  }

  function formatDateUS(date) {
    var d = new Date(date);

    var curr_date = d.getDate();
    curr_date = normalizeDate(curr_date);

    var curr_month = d.getMonth();
    curr_month++;
    curr_month = normalizeDate(curr_month);

    var curr_year = d.getFullYear();

    return curr_month + "-" + curr_date + "-" + curr_year;

  }

  function getAgeInYears(dateOfBirth) {
    var dob = new Date(dateOfBirth);
    var timeDiff = Math.abs(Date.now() - dob.getTime());
    return Math.floor(timeDiff / (1000 * 3600 * 24 * 365));
  }

  function normalizeDate(el) {
    el = el + "";
    if (el.length == 1) {
      el = "0" + el;
    }
    return el;
  }

  // display page
    getPatientDemographicsNHS().done(function() {
      $.when(
        getFhirAllergies(defaultSubjectId, "Ethercis"),
        getFhirAllergies(defaultSubjectId, "Marand"),
        getFhirConditions(defaultSubjectId, "Ethercis"),
        getFhirConditions(defaultSubjectId, "Marand"),
        getFhirMedications(defaultSubjectId, "Ethercis"),
        getFhirMedications(defaultSubjectId, "Marand"),
        getFhirProcedures(defaultSubjectId, "Ethercis"),
        getFhirProcedures(defaultSubjectId, "Marand")
      ).then()
    });
});
