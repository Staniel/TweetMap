$(document).ready(function () {
    digits1=$.makeArray($('.counter-since').find('.digit')).reverse();
    digits2=$.makeArray($('.counter-since').find('.digit1')).reverse();
    keyword = "good";
    mapInitialization();

    $(".btn-group >.btn").on("click", function(e){
        liveTweets.clear();
        keyword = $(this).html();
        console.log(keyword);
        $.ajax({
            type: "GET",
            url: "tweets/"+keyword,
            dataType: "JSON",
            success: function(list){
                tweetCount = 0;
                tweetCountAll = list.size();
                updateCountSince();
                updateCountAll();
                for (var i in list)
                {
                    var tweetLocation = new google.maps.LatLng(list[i].lat,list[i].lng);
                    liveTweets.push(tweetLocation);
                }
            },
            error: function(){
                console.log("error!");
            }
        });
    });

})

var liveTweets = new google.maps.MVCArray();
var socket = null;
var digits1 = [];
var digits2 = [];
var tweetCount = 0;
var tweetCountAll = 0;
var keyword = null;
var imageTwitter = {
    url: 'images/twitter_small.png'
};
var map;
var heatmap;

var mapInitialization = function () {
    var myLatlng = new google.maps.LatLng(40,-70);
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: myLatlng,
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: liveTweets,
        radius: 25
    });
    heatmap.setMap(map);

};

var startStreaming = function () {
    console.log("start socket connection");
    socket = io();
    socket.on('ts', function (data) {
        if (data.keyword != keyword)
            console.log("pass");
        else
        {
            var tweetLocation = new google.maps.LatLng(data.lat,data.lng);
            console.log(data.keyword);
            liveTweets.push(tweetLocation);
            tweetCount++;
            tweetCountAll++;

            var marker = new google.maps.Marker({
                position: tweetLocation,
                map: map,
                icon: imageTwitter
            });
            setTimeout(function(){
                marker.setMap(null);
            },600);
            updateCountSince();
            updateCountAll();
        }
    });
    socket.connect();//to start a new connection
};

var endStreaming = function () {
    socket.disconnect();
    socket = null;
    console.log('Disconnected request is sent');
};

var updateCountSince = function () {
    var tmp, length;
    tmp=tweetCount.toString();
    if(tmp=='0'){
        for(var i=0;i<7;i++){
            digits1[i].innerHTML = '-';
        }

    }
    length=tmp.length;
    for(var i=0;i<length;i++){
        digits1[i].innerHTML = tmp.charAt(length-i-1);
    }
    for(var i=length;i<7;i++){
        digits1[i].innerHTML = '-';
    }

}

var updateCountAll = function () {
    var tmp, length;
    tmp=tweetCountAll.toString();
    if(tmp=='0'){
        for(var i=0;i<7;i++){
            digits[i].innerHTML = '-';
        }

    }
    length=tmp.length;
    for(var i=0;i<length;i++){
        digits2[i].innerHTML = tmp.charAt(length-i-1);
    }
    for(var i=length;i<7;i++){
        digits2[i].innerHTML = '-';
    }
}




