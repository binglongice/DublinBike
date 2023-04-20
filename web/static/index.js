let hourlyChart;
let dailyChart;
let avgHourBikesPredictionChart;
let chartData = {hourly: []};
let stations;
let stationsLookUpTable;
let map


function generateGoogleMapMarker(data, getMarkerIcon) {
    return new google.maps.Marker({
        map: map,
        clickable: true,
        position: {lat: data.position.lat, lng: data.position.lng},
        icon: getMarkerIcon(data.available_bikes)
    });
}

function generateGoogleMapDisplayInfo(data) {
    const info = "<h3>"
        + data.address
        + "</h3><span style=\"text-align: center;font-size:20px;\">Bikes Available: "
        + data.available_bikes + "</br>Bikes Stands Available: "
        + data.available_bike_stands + "</br>Status: " + data.status
        + "</Span></br></br><a style=\"font-size:16px;text-align:center;\" href=\"http://maps.google.com/maps?q="
        + data.position.lat + ","
        + data.position.lng + "\" target=\"_blank\">Check in map</a></span>";

    return new google.maps.InfoWindow({
        content: info
    })
}

function getMarkerIcon(availableBikes) {
    if (availableBikes === 0) {
        return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    } else if (availableBikes <= 5) {
        return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    } else {
        return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    }
}

// Initialize and add the map
function initMap() {

    // The location of Dublin
    const dublin = {lat: 53.350140, lng: -6.266155};
    // The map, centered at Dublin
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: dublin,
    });
    // Create DirectionsService and DirectionsRenderer objects
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
    });


    // Add event listener to the go button
    const goButton = document.getElementById("go-button");
    goButton.onclick = function (event) {
        event.preventDefault();
        calculateRoute(directionsService, directionsRenderer);
    };


    let NAME = "Dublin";
    let APIKEY = "be7bc3cd2980729c4018ffced93e0ef8a4e3067e";
    let url = "https://api.jcdecaux.com/vls/v1/stations?contract=" + NAME + "&apiKey=" + APIKEY;

    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            let data = JSON.parse(xmlhttp.responseText);
            stations = data;
            createSelectedStationLoopUpTable();

            for (let i = 0; i < data.length; i++) {
                const marker = generateGoogleMapMarker(data[i], getMarkerIcon)
                let displayInfo = generateGoogleMapDisplayInfo(data[i])

                onClickGoogleMapDot(marker, displayInfo, data[i])

            }

            // Initialize arrays to store bike stations with available bikes and available bike stands
            let bikeStationsWithAvailableBikes = [];
            let bikeStationsWithAvailableBikeStands = [];

            // Loop through bike stations data and push stations with available bikes and bike stands to arrays
            for (let i = 0; i < data.length; i++) {
                if (data[i].available_bikes > 0) {
                    bikeStationsWithAvailableBikes.push(data[i]);
                }
                if (data[i].available_bike_stands > 0) {
                    bikeStationsWithAvailableBikeStands.push(data[i]);
                }
            }
            // Get user's current location
            navigator.geolocation.getCurrentPosition(function (position) {
                const userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                // Calculate distance between user's location and bike stations with available bikes
                let bikeStationsWithDistances = [];
                for (let i = 0; i < bikeStationsWithAvailableBikes.length; i++) {
                    const bikeStationLocation = new google.maps.LatLng(bikeStationsWithAvailableBikes[i].position.lat, bikeStationsWithAvailableBikes[i].position.lng);
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(userLocation, bikeStationLocation);
                    bikeStationsWithDistances.push({
                        bikeStation: bikeStationsWithAvailableBikes[i],
                        distance: distance
                    });
                }

                // Sort bike stations with distances in ascending order
                bikeStationsWithDistances.sort(function (a, b) {
                    return a.distance - b.distance;
                });

                // Get first 3 bike stations with available bikes as recommendations for user's starting location
                // const startingLocationRecommendations = bikeStationsWithDistances.filter(function (bikeStationWithDistance) {
                //     return bikeStationWithDistance.bikeStation.available_bikes > 0;
                // }).slice(0, 3);
                // console.log(startingLocationRecommendations)
            });


        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

let googleMapPreviousInfo;

function showGoogleInfo(googleMapCurrentInfo, marker) {
    typeof googleMapPreviousInfo !== 'undefined' && googleMapPreviousInfo.close();//if variable is defined close
    googleMapCurrentInfo.setPosition(marker.position);
    googleMapCurrentInfo.open(map);
    googleMapPreviousInfo = googleMapCurrentInfo;
}

function onClickGoogleMapDot(marker, info, station) {
    google.maps.event.addListener(marker, 'click', function () {
        showGoogleInfo(info, marker);
        changeStationSelectOption(station);
        updateCurrentStationStatus(station);
    })
}

async function updateCurrentStationStatus(station) {
    document.getElementById("current-station-bikes").innerHTML = station['available_bikes']
    document.getElementById("current-station-bike-stands").innerHTML = station['available_bike_stands']
    document.getElementById("current-station-status").innerHTML = station['status']
}

async function updateFutureStationStatus(station) {
    document.getElementById("future-station-bikes").innerHTML = Math.round(station['res'][1])
    document.getElementById("future-station-bike-stands").innerHTML = Math.round(station['res'][0])
}

async function createSelectedStationLoopUpTable() {
    stationsLookUpTable = Object.fromEntries(stations.map((station) => [station.number, station]))
}

window.initMap = initMap;

// Calculate and display the route between the origin and destination addresses
function calculateRoute(directionsService, directionsRenderer) {
    const originInput = document.getElementById("from");
    const destinationInput = document.getElementById("to");
    // const origin = originInput.options[originInput.selectedIndex].text;
    // const destination = destinationInput.options[destinationInput.selectedIndex].text;
    const origin = {lat: stationsLookUpTable[originInput.value].position.lat, lng: stationsLookUpTable[originInput.value].position.lng}
    const destination = {lat: stationsLookUpTable[destinationInput.value].position.lat, lng: stationsLookUpTable[destinationInput.value].position.lng}

    if (origin === "From" || destination === "To" || origin === destination) {
        window.alert("The select stations are invalid");
    } else {
        directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.WALKING,
            },
            (result, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(result);
                } else {
                    window.alert("Directions request failed due to " + status);
                }
            }
        );
    }
}

async function fetchAvgBikesPerHour() {
    if (chartData.hourly.length === 0) {
        const response = await fetch("/avg_bikes_per_hour");
        const data = await response.json();
        chartData.hourly = data;
        return data;
    } else {
        return chartData.hourly;
    }
}

async function getStations() {
    if (!stations) {
        const response = await fetch("/stations");
        return await response.json();
    } else {
        return stations;
    }
}

async function fetchAvgBikesPerDay(stationId) {
    const response = await fetch(`/avg_bikes_per_day/${stationId}`);
    return await response.json();
}

function createOption(station) {
    const option = document.createElement("option");
    option.value = station.number;
    option.textContent = station.name;
    return option;
}


async function populateStationOptions() {
    const stations = await getStations();
    const stationSelect = document.getElementById("stationSelect");
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");

    stations.forEach((station) => {
        stationSelect.appendChild(createOption(station));
        fromSelect.appendChild(createOption(station));
        toSelect.appendChild(createOption(station));
    });

    stationSelect.removeEventListener("change", updateChartForSelectedStation);
    stationSelect.addEventListener("change", () => {
        const station = stationsLookUpTable[stationSelect.options[stationSelect.selectedIndex].value]
        updateCurrentStationStatus(station);
        showGoogleInfo(generateGoogleMapDisplayInfo(station), generateGoogleMapMarker(station, getMarkerIcon))
        updateChartForSelectedStation();
    });
}

function changeStationSelectOption(selectedStation) {
    const stationSelect = document.getElementById("stationSelect");
    stationSelect.value = selectedStation['number']
    updateChartForSelectedStation();
}


function updateChartForSelectedStation() {
    const stationSelect = document.getElementById("stationSelect");
    const selectedStationId = stationSelect.value;

    if (hourlyChart) {
        hourlyChart.destroy(); // Destroy the previous chart to create a new one
        // console.log("Updating hourlyChart for selected station:", selectedStationId);
    }

    if (dailyChart) {
        dailyChart.destroy(); // Destroy the previous chart to create a new one
        // console.log("Updating dailyChart for selected station:", selectedStationId);
    }

    if (avgHourBikesPredictionChart) {
        avgHourBikesPredictionChart.destroy(); // Destroy the previous chart to create a new one
        document.getElementById("avgHourBikesPredictionChart").style.display = "none";
        document.getElementById("loading").style.display = "";
        // console.log("Updating hourlyChart prediction for selected station:", selectedStationId);
    }

    renderAvgBikesPerHourChartInOneWeek(selectedStationId).then(() => {
        document.getElementById("loading").style.display = "none";
    });
    renderAvgBikesPerDayChart(selectedStationId);
    resizeCanvas();
}

async function renderAvgBikesPerDayChart(number) {
    const response = await fetch(`/avg_bikes_per_day/${number}`);
    const data = await response.json();

    const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const chartData = Array(7).fill(0);
    data.forEach((row) => {
        chartData[row.day_of_week] = row.avg_bikes;
    });

    const customColor = "rgba(75, 192, 192, 0.2)";
    const customBorderColor = "rgba(75, 192, 192, 1)";

    const canvas = document.getElementById("avgDayBikesChart");

    if (dailyChart && dailyChart.canvas === canvas) {
        dailyChart.destroy();
    }

    const ctx = canvas.getContext("2d");
    dailyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Availability',
                    data: chartData,
                    backgroundColor: customColor,
                    borderColor: customBorderColor,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Average Bikes Available",
                    },
                },
            },
        },
    });
    document.getElementById("avgHourBikesPredictionChart").style.display = "";
    // console.log("Rendered daily chart for station", number);
}

async function getPrediction(stationNumber) {
    const response = await fetch(`/prediction?station_number=` + stationNumber);
    const data = await response.json();
    // console.log(data);
    return data;
}


function getWeekdayAndHour(timestamp) {
  const date = new Date(timestamp * 1000);
  const weekday = date.getDay();
  const hour = date.getHours();

  return {weekday, hour};
}

function convertDataToMap(data) {
  const resultMap = new Map();

  for (const item of data) {
    const {weekday, hour} = getWeekdayAndHour(item.datetime);

    if (!resultMap.has(weekday)) {
      resultMap.set(weekday, []);
    }

    resultMap.get(weekday)[hour] = item.res[1];
  }

  return resultMap;
}

// Helper function to create a random color
function randomColor(opacity) {
  return `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${opacity})`;
}

// Function to convert resultMap to an array of objects with the desired structure
function convertMapToArray(resultMap) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const resultArray = [];

  for (const [weekdayIndex, resArray] of resultMap.entries()) {
    const weekdayData = {
      label: weekdays[weekdayIndex],
      data: Array(24).fill(0),
      backgroundColor: randomColor(0.2),
      borderColor: randomColor(1),
      borderWidth: 1,
    };

    for (let hour = 0; hour < 24; hour++) {
      if (resArray[hour]) {
        weekdayData.data[hour] = Math.round(resArray[hour]);
      }
    }

    resultArray.push(weekdayData);
  }

  return resultArray;
}


async function renderAvgBikesPerHourChartInOneWeek(number) {

    const data = await getPrediction(number);
    updateFutureStationStatus(data[1])
    // const selectedStationData = data.filter(row => row.number === Number(number));
    const labels = Array.from({length: 24}, (_, i) => i);

    const dataByWeekday = convertDataToMap(data);
    const datasets = convertMapToArray(dataByWeekday);

    const canvas = document.getElementById("avgHourBikesPredictionChart");

    if (avgHourBikesPredictionChart && avgHourBikesPredictionChart.canvas === canvas) {
        avgHourBikesPredictionChart.destroy();
    }

    const ctx = canvas.getContext("2d");
    avgHourBikesPredictionChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Average Bikes Available",
                    },
                },
            },
        },
    });
}

async function initWeather() {
    const response = await fetch(`/weather_info_display`);
    const data = await response.json();
    console.log(data);
    const now = data[0];
    const oneHourLater = data[1];
    const weatherEle = document.getElementById("weather");
    weatherEle.innerHTML = now['temp'] + "°C" + "     " + now['conditions']

    const weatherEleOneHourTemp = document.getElementById("temp");
    weatherEleOneHourTemp.innerHTML = "Temp: " + oneHourLater['temp'] + "°C";
    const weatherEleOneHourCondition = document.getElementById("condition");
    weatherEleOneHourCondition.innerHTML = "Condition: " + oneHourLater['conditions'];
    const weatherEleOneHourWind = document.getElementById("wind");
    weatherEleOneHourWind.innerHTML = "Windspeed: " + oneHourLater['windspeed']
}

await Promise.all([fetchAvgBikesPerHour(), populateStationOptions(), initWeather()])
    .then(() => {
        updateChartForSelectedStation();
        updateCurrentStationStatus(stationsLookUpTable[document.getElementById("stationSelect").value]);
    });


function resizeCanvas() {
    const canvas1 = document.getElementById("avgHourBikesPredictionChart");
    const canvas2 = document.getElementById("avgDayBikesChart");

    canvas1.width = canvas1.parentNode.clientWidth * 0.9;
    canvas1.height = canvas1.parentNode.clientHeight * 0.9;

    canvas2.width = canvas2.parentNode.clientWidth * 0.9;
    canvas2.height = canvas2.parentNode.clientHeight * 0.9;
}

window.addEventListener("resize", resizeCanvas);