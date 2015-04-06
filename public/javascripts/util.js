$(document).ready(function () {
    var socket = io();
    var liveTweets = new google.maps.MVCArray();
    var myLatlng = new google.maps.LatLng(40,-70);
    var map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: myLatlng,
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: liveTweets,
        radius: 25
    });
    heatmap.setMap(map);
    $.get( "tweets/"+$('#keyword').val(), function( list ) {
        // console.log($('#keyword').val());
        console.log(list);
        for (var i in list)
        {
            var tweetLocation = new google.maps.LatLng(list[i].lng,list[i].lat);
            liveTweets.push(tweetLocation);
        }
    });
    socket.on('ts', function (data) {
        if (data.keyword != $('#keyword').val())
            console.log("pass");
        else
        {
            var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
            console.log(tweetLocation);
            liveTweets.push(tweetLocation);
            var image = {
                url: 'images/twitter_small.png'
            };
            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                icon: image
            });
            setTimeout(function(){
                marker.setMap(null);
            },600);
        }
    });

})
