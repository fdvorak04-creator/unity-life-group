// ---------------------------------------------------------------------------
// licensing.js
// Powers the one interactive piece on /new-agents/licensing: the "which vendor
// gives my state's exam?" picker.
//
// Every state hands its insurance exam to one of three national testing
// companies. The agent picks their state; we show them who that is and send
// them straight to the right booking site.
// ---------------------------------------------------------------------------

// The three testing companies, and where you book with each.
var VENDORS = {
  pearson:   { name: "Pearson VUE", url: "https://home.pearsonvue.com" },
  psi:       { name: "PSI",         url: "https://www.psiexams.com" },
  prometric: { name: "Prometric",   url: "https://www.prometric.com" }
};

// Every state (plus Washington DC), and which company runs its exam.
//
// This ONE list is the single source of truth: it both builds the dropdown and
// answers the question. Keeping a separate list of state names for the dropdown
// would mean two lists that could quietly fall out of step with each other.
// To correct a state later, change it here and the whole page follows.
var STATES = [
  { name: "Alabama",              vendor: "psi" },
  { name: "Alaska",               vendor: "pearson" },
  { name: "Arizona",              vendor: "prometric" },
  { name: "Arkansas",             vendor: "prometric" },
  { name: "California",           vendor: "psi" },
  { name: "Colorado",             vendor: "pearson" },
  { name: "Connecticut",          vendor: "pearson" },
  { name: "Delaware",             vendor: "pearson" },
  { name: "District of Columbia", vendor: "pearson" },
  { name: "Florida",              vendor: "pearson" },
  { name: "Georgia",              vendor: "pearson" },
  { name: "Hawaii",               vendor: "pearson" },
  { name: "Idaho",                vendor: "prometric" },
  { name: "Illinois",             vendor: "pearson" },
  { name: "Indiana",              vendor: "pearson" },
  { name: "Iowa",                 vendor: "pearson" },
  { name: "Kansas",               vendor: "pearson" },
  { name: "Kentucky",             vendor: "prometric" },
  { name: "Louisiana",            vendor: "psi" },
  { name: "Maine",                vendor: "pearson" },
  { name: "Maryland",             vendor: "psi" },
  { name: "Massachusetts",        vendor: "pearson" },
  { name: "Michigan",             vendor: "psi" },
  { name: "Minnesota",            vendor: "psi" },
  { name: "Mississippi",          vendor: "pearson" },
  { name: "Missouri",             vendor: "pearson" },
  { name: "Montana",              vendor: "pearson" },
  { name: "Nebraska",             vendor: "prometric" },
  { name: "Nevada",               vendor: "pearson" },
  { name: "New Hampshire",        vendor: "prometric" },
  { name: "New Jersey",           vendor: "psi" },
  { name: "New Mexico",           vendor: "psi" },
  { name: "New York",             vendor: "psi" },
  { name: "North Carolina",       vendor: "pearson" },
  { name: "North Dakota",         vendor: "psi" },
  { name: "Ohio",                 vendor: "psi" },
  { name: "Oklahoma",             vendor: "psi" },
  { name: "Oregon",               vendor: "psi" },
  { name: "Pennsylvania",         vendor: "psi" },
  { name: "Rhode Island",         vendor: "pearson" },
  { name: "South Carolina",       vendor: "psi" },
  { name: "South Dakota",         vendor: "prometric" },
  { name: "Tennessee",            vendor: "pearson" },
  { name: "Texas",                vendor: "pearson" },
  { name: "Utah",                 vendor: "prometric" },
  { name: "Vermont",              vendor: "prometric" },
  { name: "Virginia",             vendor: "prometric" },
  { name: "Washington",           vendor: "psi" },
  { name: "West Virginia",        vendor: "pearson" },
  { name: "Wisconsin",            vendor: "psi" },
  { name: "Wyoming",              vendor: "pearson" }
];


// Grab the pieces of the page we need to read and update.
var select     = document.getElementById("state-select");
var result     = document.getElementById("exam-result");
var vendorName = document.getElementById("exam-vendor");
var vendorLink = document.getElementById("exam-link");
var vendorText = document.getElementById("exam-link-text");

// If we're not on the licensing page, there's nothing to do. (main.js and this
// file are both plain scripts; this guard just keeps it harmless anywhere else.)
if (select && result) {

  // ---- 1. Fill the dropdown from the list above ----------------------------
  STATES.forEach(function (state, index) {
    var option = document.createElement("option");
    // The VALUE is the state's position in the list, so looking the state back
    // up on selection is exact — no matching on text that could be mistyped.
    option.value = String(index);
    option.textContent = state.name;
    select.appendChild(option);
  });

  // ---- 2. React whenever a state is picked --------------------------------
  select.addEventListener("change", function () {
    // They re-picked the "Select your state…" placeholder (its value is ""), so
    // hide the answer rather than leaving a stale one on screen.
    //
    // This is tested against "" on purpose. Number("") is 0 — NOT NaN — so
    // handing the empty placeholder to STATES[Number(...)] would confidently
    // return the FIRST state in the list and tell the agent their vendor was
    // Alabama's. The check has to happen before the value is turned into a number.
    if (select.value === "") {
      result.classList.remove("is-visible");
      return;
    }

    var state = STATES[Number(select.value)];
    if (!state) return;

    var vendor = VENDORS[state.vendor];

    vendorName.textContent = vendor.name;
    vendorLink.href        = vendor.url;
    vendorText.textContent = "Book with " + vendor.name;

    // A clear, specific description for screen readers and for anyone hovering.
    vendorLink.setAttribute(
      "aria-label",
      "Book your " + state.name + " exam with " + vendor.name + " (opens in a new tab)"
    );

    result.classList.add("is-visible");
  });
}
