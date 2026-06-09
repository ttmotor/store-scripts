/* ---------- 1.  CONFIG -------------------------------------------------- */
var SWIFTCOMPLETE_API_KEY        = "235151ba-9253-49ae-9faa-554da7ddecaa"; 

/* ---------- 2.  LOAD swiftlookup.js ------------------------------------- */
!function (e, t, c) {
e.swiftcomplete = e.swiftcomplete || {};
var s = t.createElement("script");
s.async = !0, s.src = c;
var r = t.getElementsByTagName("script")[0]; 
if (r && r.parentNode) {
    r.parentNode.insertBefore(s, r);
} else {
    t.head.appendChild(s);
}
    }(window, document, "https://assets.swiftcomplete.com/js/swiftlookup.js");

/* ---------- 3.  DYNAMIC OBSERVATION ENGINE ------------------------------ */
(function() {
    var initializedFields = new Set();

    function scanAndBindCheckout() {
        var targetFields = document.querySelectorAll('input[name="address-line1"]');
        if (targetFields.length === 0) return;

        targetFields.forEach(function(address1El) {
            if (initializedFields.has(address1El)) return;
            initializedFields.add(address1El);

            if (!address1El.id) {
                address1El.id = 'ec-address-' + Math.random().toString(36).substr(2, 9);
            }

            if (window.swiftcomplete && typeof window.swiftcomplete.runWhenReady === 'function') {
                swiftcomplete.runWhenReady(function () {
                    const CONTROL_KEY = address1El.id;
                    
                    if (swiftcomplete.controls && swiftcomplete.controls[CONTROL_KEY]) {
                        delete swiftcomplete.controls[CONTROL_KEY];
                    }

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

                        /* --- FORCE DATA SYNC --- */
                        populateResult: function(result) {
                            this.constructor.prototype.options.populateResult.call(this, result);

                            setTimeout(function() {
                                var fields = ["address-line1", "address-line2", "city", "state", "zip", "Country", "organization"];
                                fields.forEach(function (name) {
                                    var el = document.querySelector('input[name="' + name + '"]');
                                    if (el) {
                                        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                        el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                                    }
                                });

                                if (window.Ecwid && typeof window.Ecwid.refreshConfig === 'function') {
                                    window.Ecwid.refreshConfig();
                                }
                            }, 100);
                        }
                    });
                    
                    address1El.addEventListener('swiftcomplete:swiftlookup:manualentry', (e) => {      
                         if (e) {
                             e.preventDefault();          
                             e.stopPropagation();         
                         }
                         address1El.value = '';
                         address1El.focus();
                    });

                    var ctrl = swiftcomplete.controls[CONTROL_KEY];
                    ctrl.groupBy("road,emptyroad");
                    ctrl.setMaxAutocompleteResults(5);
                    ctrl.setMaxContainerResults(100);
                    ctrl.setCountries("us"); 
                });
            }
        });
    }

    var observer = new MutationObserver(function() {
        scanAndBindCheckout();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scanAndBindCheckout);
    } else {
        scanAndBindCheckout();
    }
})();
