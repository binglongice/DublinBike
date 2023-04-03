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
                        position:{ lat: data[i].position.lat, lng: data[i].position.lng}


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