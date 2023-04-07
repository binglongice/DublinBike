// Initialize and add the map
function initMap() {
  // The location of Dublin
  const dublin = { lat: 53.350140, lng: -6.266155 };
  // The map, centered at Dublin
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: dublin,
  });

  // Create DirectionsService and DirectionsRenderer objects
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
  });


  // Add event listener to the directions form
  const directionsForm = document.getElementById("directions-form");
  directionsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateRoute(directionsService, directionsRenderer);
  });



  let NAME = "Dublin";
  let APIKEY = "be7bc3cd2980729c4018ffced93e0ef8a4e3067e";
  let url = "https://api.jcdecaux.com/vls/v1/stations?contract="+NAME+"&apiKey="+APIKEY;

  let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function (){
         if(xmlhttp.readyState === 4 && xmlhttp.status === 200){
             let data = JSON.parse(xmlhttp.responseText);
//           console.log(data[0].position.lat)
      function getMarkerIcon(availableBikes) {
         if (availableBikes === 0) {
           return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
         } else if (availableBikes <= 5) {
           return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
         } else {
           return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
         }
       }
             for(let i = 0; i < data.length;i ++){
                 const marker = new google.maps.Marker({
//                        storkeColor: "green",
//                        strokeOpacity: '0.9',
//                        strokeWeight: 0,
//                        fillColor:'blue',
//                        fillOpacity: 0.4,
                        map: map,
//                        radius:150,
                        clickable:true,
                        position:{ lat: data[i].position.lat, lng: data[i].position.lng},
                        icon: getMarkerIcon(data[i].available_bikes)


               })
                let displayInfo = "<h3>"
                   + data[i].address
                   + "</h3><span style=\"text-align: center;font-size:20px;\">Bikes Available: "
                   + data[i].available_bikes + "</br>Bikes Stands Available: "
                   + data[i].available_bike_stands
                   + "</Span></br></br><a style=\"font-size:16px;text-align:center;\" href=\"http://maps.google.com/maps?q="
                   +data[i].position.lat+","
                   +data[i].position.lng+"\" target=\"_blank\">Check in map</a></span>"

                  onceClick(map,marker,displayInfo)

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
               navigator.geolocation.getCurrentPosition(function(position) {
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
              bikeStationsWithDistances.sort(function(a, b) {
                 return a.distance - b.distance;
              });

              // Get first 3 bike stations with available bikes as recommendations for user's starting location
              const startingLocationRecommendations = bikeStationsWithDistances.filter(function(bikeStationWithDistance) {
                  return bikeStationWithDistance.bikeStation.available_bikes > 0;
               }).slice(0, 3);
              console.log(startingLocationRecommendations)
             });



         }
      }
      xmlhttp.open("GET", url, true);
      xmlhttp.send();


  // The marker
//  const marker = new google.maps.Marker({
//    position: dublin,
//    map: map,
//  });
}

window.initMap = initMap;

function onceClick(map, marker, info){
    let showInfo = new google.maps.InfoWindow({
        content:info
    })

    google.maps.event.addListener(marker, 'click', function(e){
        showInfo.setPosition(marker.position);
        showInfo.open(map);
    })
}


// Calculate and display the route between the origin and destination addresses
function calculateRoute(directionsService, directionsRenderer) {
  const originInput = document.getElementById("origin-input");
  const destinationInput = document.getElementById("destination-input");
  const origin = originInput.value;
  const destination = destinationInput.value;

  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
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

//async function fetchAvgBikesPerHour() {
//  const response = await fetch("/avg_bikes_per_hour");
//  const data = await response.json();
//  return data;
//}
let chart;
let chartData = { hourly: [] };

async function fetchAvgBikesPerHour() {
  const response = await fetch("/avg_bikes_per_hour");
  const data = await response.json();
  chartData.hourly = data;
//  console.log("Hourly data fetched:", data);
  return data;
}

async function fetchAvgBikesPerDay(stationId) {
  const response = await fetch(`/avg_bikes_per_day/${stationId}`);
  const data = await response.json();
//  console.log(`Data fetched for station ${stationId}:`, data);
  return data;
}


async function populateStationOptions() {
  const data = await fetchAvgBikesPerHour();
  const stationSelect = document.getElementById("stationSelect");

  const stationIds = [...new Set(data.map((row) => row.number))];
  stationIds.forEach((number) => {
    const option = document.createElement("option");
    option.value = number;
    option.textContent = `Station ${number}`;
    stationSelect.appendChild(option);
//    console.log("Populated station options:", stationIds);
  });

  const chartTypeSelect = document.getElementById("chartTypeSelect");
  chartTypeSelect.removeEventListener("change", updateChartForSelectedStation);
  chartTypeSelect.addEventListener("change", () => {
    updateChartForSelectedStation(chart, data);
//    console.log("Added event listener for station selection change");
  });

  stationSelect.removeEventListener("change", updateChartForSelectedStation);
  stationSelect.addEventListener("change", () => {
    updateChartForSelectedStation(chart, data);
//    console.log("Added event listener for station selection change");
  });
}


function updateChartForSelectedStation(chart, data) {
  // Guard clause to prevent multiple calls
//  console.log("Chart element:", document.getElementById("avgBikesPerHourChart"));
  const ctx = document.getElementById("avgBikesChart").getContext("2d");
  if (chart && chart.canvas.id !== "avgBikesChart" && chart.canvas.id !== "avgBikesChart") {
    console.log("Chart already rendered for selected station and chart type");
    return;
  }

  const stationSelect = document.getElementById("stationSelect");
  const chartTypeSelect = document.getElementById("chartTypeSelect");
  const selectedStation = stationSelect.value;
  const selectedChartType = chartTypeSelect.value;

  if (chart) {
    chart.destroy(); // Destroy the previous chart to create a new one
    console.log("Updating chart for selected station:", selectedStation, "Chart type:", selectedChartType);
  }

  if (selectedChartType === "hourly") {
    renderAvgBikesPerHourChart(selectedStation);
  } else if (selectedChartType === "daily") {
    renderAvgBikesPerDayChart(selectedStation);
  }
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

  const canvas = document.getElementById("avgBikesChart");

  if (chart && chart.canvas === canvas) {
    chart.destroy();
  }

  const ctx = canvas.getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Station ${number}`,
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
            text: "Day of Week",
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
  document.getElementById("avgBikesChart").id = "avgBikesChart";
  console.log("Rendered hourly chart for station", number);
}


async function renderAvgBikesPerHourChart(number) {
  const data = chartData.hourly;
  const selectedStationData = data.filter(row => row.number === Number(number));
  const labels = Array.from({ length: 24 }, (_, i) => i);

  const dataset = {
    label: `Station ${number}`,
    data: Array(24).fill(0),
    backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`,
    borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
    borderWidth: 1,
  };

  selectedStationData.forEach((row) => {
    dataset.data[row.hour_of_day] = row.avg_bikes;
  });

  const ctx = document.getElementById("avgBikesChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [dataset],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Hour of Day",
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
  console.log("Rendered hourly chart for station", number);

  // Populate the station options and update the chart with the initial station data
  populateStationOptions();
}




fetchAvgBikesPerHour();
populateStationOptions();
//renderAvgBikesPerHourChart();
