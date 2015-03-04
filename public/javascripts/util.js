var socket = io();
function initialize() {
var myLatlng = new google.maps.LatLng(40,-70);
var map = new google.maps.Map(document.getElementById('map-canvas'), {
	  center: myLatlng,
	  zoom: 2,
	  mapTypeId: google.maps.MapTypeId.ROADMAP
	});
var liveTweets = new google.maps.MVCArray();
var heatmap = new google.maps.visualization.HeatmapLayer({
    data: liveTweets,
    radius: 25
  });
heatmap.setMap(map);
socket.on('twitter-stream', function (data) {
    var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
    console.log(data);
    liveTweets.push(tweetLocation);
  //Flash a dot onto the map quickly
  var marker = new google.maps.Marker({
    position: tweetLocation,
    map: map
  });
  setTimeout(function(){
    marker.setMap(null);
  },600);
});
socket.on("connected", function(r) {
  socket.emit("start tweets");
});
}
function getval(sel){
	alert(sel.value);
	socket.emit("stop");
}