// Initialize and add the map
function initMap() {
  // The location of Dublin
  const dublin = { lat: 53.350140, lng: -6.266155 };
  // The map, centered at Dublin
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: dublin,
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
                 const circle = new google.maps.Circle({
                        storkeColor: "green",
                        strokeOpacity: '0.9',
                        strokeWeight: 0,
                        fillColor:'blue',
                        fillOpacity: 0.4,
                        map: map,
                        radius:150,
                        clickable:true,
                        center:{ lat: data[i].position.lat, lng: data[i].position.lng}


               })
                let displayInfo = "<h3>"
                   + data[i].address
                   + "</h3><span style=\"text-align: center;font-size:20px;\">Bikes Available: "
                   + data[i].available_bikes + "</br>Bikes Stands Available: "
                   + data[i].available_bike_stands
                   + "</Span></br></br><a style=\"font-size:16px;text-align:center;\" href=\"http://maps.google.com/maps?q="
                   +data[i].position.lat+","
                   +data[i].position.lng+"\" target=\"_blank\">Check map</a></span>"

                  onceClick(map,circle,displayInfo)

             }


         }
      }
      xmlhttp.open("GET", url, true);
      xmlhttp.send();

  // The marker
  const marker = new google.maps.Marker({
    position: dublin,
    map: map,
  });
}

window.initMap = initMap;

function onceClick(map, circle, info){
    let showInfo = new google.maps.InfoWindow({
        content:info
    })

    google.maps.event.addListener(circle, 'click', function(e){
        showInfo.setPosition(circle.getCenter());
        showInfo.open(map);
    })
}