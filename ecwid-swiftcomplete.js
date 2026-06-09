
/* ---------- 1.  CONFIG -------------------------------------------------- */
var SWIFTCOMPLETE_API_KEY        = "235151ba-9253-49ae-9faa-554da7ddecaa"; // Your Live API Key
var RETRY_MS                     = 100;        // poll interval while waiting for checkout DOM

/* ---------- 2.  LOAD swiftlookup.js ------------------------------------- */
!function (e, t, c) {
e.swiftcomplete = e.swiftcomplete || {};
var s = t.createElement("script");
s.async = !0, s.src = c;
var r = t.getElementsByTagName("script")[0]; 
r.parentNode.insertBefore(s, r);
    }(window, document, "https://assets.swiftcomplete.com/js/swiftlookup.js");

/* ---------- 3.  BOOTSTRAP WITH OFFICIAL ECWID DYNAMIC TRACKING ---------- */
// FIXED: This monitors Ecwid's internal page changes so the dropdown hooks up every single time without a refresh
if (typeof Ecwid === 'object' && Ecwid.OnPageLoaded) {
    Ecwid.OnPageLoaded.add(function(page) {
        if (page.type === "CHECKOUT_SHIPPING_ADDRESS" || page.type === "CHECKOUT") {
            waitForEcwid();
        }
    });
} else {
    // Fallback if the customer lands directly on a hard-coded checkout URL
    window.addEventListener("load", waitForEcwid);
}

function waitForEcwid () {
  /* wait until Ecwid form & inputs exist */
  var form       = document.querySelector("form.ec-form");
  var address1El = document.querySelector('input[name="address-line1"]');

  if (!form || !address1El) {       // not yet rendered → retry safely
      return setTimeout(waitForEcwid, RETRY_MS);
  }
  initSwiftLookup(address1El);      // attach once
}

/* ---------- 4.  INIT SwiftLookup ---------------------------------------- */
function initSwiftLookup (address1El) {
    // Safety check: Prevent duplicating the autocomplete field if they click back and forth
    if (address1El.getAttribute('data-swift-bound') === 'true') return;
    address1El.setAttribute('data-swift-bound', 'true');

    // give the input an ID if it doesn't have one
    if (!address1El.id) address1El.id = 'ec-address-line1';

    swiftcomplete.runWhenReady(function () {

    /* create control */
    const CONTROL_KEY = address1El.id;          // use the element’s id as map key

    swiftcomplete.controls[CONTROL_KEY] = new swiftcomplete.SwiftLookup({
        field : address1El,
        key   : SWIFTCOMPLETE_API_KEY,
        emptyQueryMode   : "prompt",
        promptText       : "Type your address to start searching",
        manualEntryText  : "Enter address manually",
        noResultsText    : "No addresses found - click to type manually",
        scrollToFieldOnFocus : true,

        populateLineFormat : [
            { field: address1El                                           , format: "BuildingName, BuildingNumber SecondaryRoad, Road" },
            { field: document.querySelector('input[name="address-line2"]'), format: "SubBuilding" },
            { field: document.querySelector('input[name="city"]')         , format: "PRIMARYLOCALITY" },
            { field: document.querySelector('input[name="state"]')        , format: "AdministrativeArea" }, 
            { field: document.querySelector('input[name="zip"]')          , format: "POSTCODE" },
            { field: document.querySelector('input[name="Country"]')      , format: "PrimaryCountry" },
            { field: document.querySelector('input[name="organization"]') , format: "Company" }
        ],

        /* --- THE FINAL CART FIX: Update Ecwid's internal system directly --- */
        populateResult: function(result) {
            // 1. Let the default Swiftcomplete autofill action run natively
            this.constructor.prototype.options.populateResult.call(this, result);

            // 2. Force Ecwid's internal application state to lock in the new data
            setTimeout(function() {
                var fields = ["address-line1", "address-line2", "city", "state", "zip", "Country", "organization"];

                // Fire native browser events so the fields update visually
                fields.forEach(function (name) {
                    var el = document.querySelector('input[name="' + name + '"]');
                    if (el) {
                        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    }
                });

                // Directly tell the Ecwid checkout framework to save the shipping address changes
                if (window.Ecwid && typeof window.Ecwid.refreshConfig === 'function') {
                    window.Ecwid.refreshConfig();
                }
            }, 100);
        }
    });
    
    const finder = address1El;  
    
    /* Handle Manual Entry Without Crashing Cart */
    finder.addEventListener('swiftcomplete:swiftlookup:manualentry', (e) => {      
         if (e) {
             e.preventDefault();          
             e.stopPropagation();         
         }
         finder.value = '';
         finder.focus();
    });

    /* fine‑tune */
    var ctrl = swiftcomplete.controls[CONTROL_KEY];
    ctrl.groupBy("road,emptyroad");
    ctrl.setMaxAutocompleteResults(5);
    ctrl.setMaxContainerResults(100);
    ctrl.setCountries("us");              // Restricts lookups exclusively to the United States
    });
}

