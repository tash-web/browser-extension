import axios from "../node_modules/axios";

// Form fields
const form = document.querySelector(".form-data");
const region = document.querySelector(".region-name");
const apiKey = document.querySelector(".api-key");

// results
const errors = document.querySelector(".errors");
const loading = document.querySelector(".loading");
const results = document.querySelector(".result-container");
const usage = document.querySelector(".carbon-usage");
const fossilfuel = document.querySelector(".fossil-fuel");
const myregion = document.querySelector(".my-region");
const clearBtn = document.querySelector(".clear-btn");

function CalculateColor(value) {
  let co2Scale = [0, 150, 600, 750, 800];
  let colors = ["#2AA364", "#F5EB4D", "#9E4229", "#381D02", "#381D02"];
  let closestNum = co2Scale.sort((a, b) => {
    return Math.abs(a - value) - Math.abs(b - value);
  })[0];
  console.log(value + " is closest to " + closestNum);

  let num = (element) => element > closestNum;
  let scaleIndex = co2Scale.findIndex(num);

  let closestColor = colors[scaleIndex];
  console.log(scaleIndex, closestColor);

  chrome.runtime.sendMessage({
    action: "updateIcon",
    value: { color: closestColor },
  });
}

form.addEventListener("submit", (e) => handleSubmit(e));
clearBtn.addEventListener("click", (e) => resizeTo(e));
init();

function init() {
  const storedApiKey = localStorage.getItem("apiKey");
  const storedRegion = localStorage.getItem("regionName");

  // set icon to be generic green
  // to do

  if (storedApiKey === null || storedRegion === null) {
    // if we don't have the keys, show the form
    form.style.display = "block";
    results.style.display = "none";
    loading.style.display = "none";
    clearBtn.style.display = "none";
    errors.textContent = "";
  } else {
    // if we have saved keys/regions in localStorage, show results when they load
    displayCarbonUsage(storedApiKey, storedRegion);
    results.style.display = "none";
    form.style.display = "none";
    clearBtn.style.display = "block";
  }

  chrome.runtime.sendMessage({
    action: "updateIcon",
    value: {
      color: "green",
    },
  });
}

function reset(e) {
  e.preventDefault();

  // clear local storage for region only
  localStorage.removeItem("regionName");
  init();
}

function handleSubmit(e) {
  e.preventDefault();
  setUpUser(apiKey.value, region.value);
}

function setUpUser(apiKey, regionName) {
  localStorage.setItem("apiKey", apiKey);
  localStorage.setItem("regionName", regionName);
  loading.style.display = "block";
  errors.textContent = "";
  clearBtn.style.display = "block";

  // make initial call
  displayCarbonUsage(apiKey, regionName);
}

async function displayCarbonUsage(apiKey, region) {
  try {
    await axios
      .get("https://api.co2signal.com/v1/latest", {
        params: {
          countryCode: region,
        },
        headers: {
          "auth-token": apiKey,
        },
      })
      .then((response) => {
        let CO2 = Math.floor(response.data.data.carbonIntensity);
        CalculateColor(CO2);

        // CalculateColor(CO2)

        loading.style.display = "none";
        form.style.display = "none";
        myregion.textContent = region;
        usage.textContent =
          Math.round(response.data.data.carbonIntensity) +
          " grams (grams CO2 emitted per kilowatt hour)";
        fossilfuel.textContent =
          response.data.data.fossilFuelPercentage.toFixed(2) +
          "% (percentage of foccil fuels used to generate electricity)";
        results.style.display = "block";
      });
  } catch (error) {
    console.log(error);
    loading.style.display = "none";
    results.style.display = "none";
    errors.textContent =
      "Sorry, we have no data for the region you have requested";
  }
}
