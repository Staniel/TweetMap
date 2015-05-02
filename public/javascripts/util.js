$(document).ready(function () {
    digits1=$.makeArray($('.counter-since').find('.digit')).reverse();
    digits2=$.makeArray($('.counter-since').find('.digit1')).reverse();
    digitsPositive = $.makeArray($('.counter-since').find('.digit2')).reverse();
    digitsNegative = $.makeArray($('.counter-since').find('.digit3')).reverse();
    keyword = "good";
    mapInitialization();
    svg = d3.select('#live-chart').append('svg').attr('class', 'chart').attr('width', chartWidth-chartMargin.left-chartMargin.right).attr('height', chartHeight).append('g').attr('transform', 'translate(' + 0 + ', ' + chartMargin.top + ')');
    svgXAxis =svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + (chartHeight - chartMargin.top - chartMargin.bottom)/2 + ')')
        .call(xAxis);
    svgYAxis = svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    svg.selectAll('.bar').data(chartData).enter().append('rect').attr('class','bar').attr('x', function(d){return xAxisScale(d.index)}).attr('y', function(d){return Math.min(yAxisScale(d.score),yAxisScale(0))}).attr('width', rectWidth).attr('height',function(d){return Math.abs(yAxisScale(d.score)-yAxisScale(0))}).style('fill', function(d){return d.color});


    $(".btn-group >.btn").on("click", function(e){
        liveTweets = [];
        keyword = $(this).html();
        console.log(keyword);
        $.ajax({
            type: "GET",
            url: "tweets/"+keyword,
            dataType: "JSON",
            success: function(list){
                console.log("success changing keyword");
                tweetCount = 0;
                tweetNegativeCount = 0;
                tweetPositiveCount = 0;
                tweetCountAll = list.length;
                updateCountPositive();
                updateCountNegative();
                updateCountSince();
                updateCountAll();
                for (var i in list)
                {
                    //var tweetLocation = new google.maps.LatLng(list[i].lat,list[i].lng);
                    var obj = {
                        lat: list[i].lng,
                        lng: list[i].lat,
                        score: convertRange(list[i].sentiScore, [-1, 1], [0, 1])
                    };
                    liveTweets.push(obj);
                }
                heatMapData = {
                    max: liveTweets.length,
                    data: liveTweets
                };
                heatmap.setData(heatMapData);

            },
            error: function(){
                console.log("error!");
            }
        });
    });

})

var liveTweets = [];
var socket = null;
var digits1 = [];
var digits2 = [];
var digitsPositive = [];
var digitsNegative = [];
var tweetCount = 0;
var tweetCountAll = 0;
var tweetPositiveCount = 0;
var tweetNegativeCount = 0;
var keyword = null;
var imageTwitter = {
    url: 'images/twitter_small.png'
};
var map;
var heatmap;
var heatMapData = null;

//real-time bar chart initialization
var chartMargin = {top: 50, left: 50, bottom: 50, right: 50},
    chartWidth = 1200,
    chartHeight = 700;
var chartData = [];
var rectWidth = 10;
var numOfBars = 30;
var index = -1;
var xAxisScale = d3.scale.linear().domain([index+1-numOfBars, index+2]).range([0,chartWidth-chartMargin.left-chartMargin.right]);
var yAxisScale = d3.scale.linear().domain([-1,1]).range([chartHeight-chartMargin.top-chartMargin.bottom, 0]);
var xAxis = d3.svg.axis().scale(xAxisScale).orient('bottom');
var yAxis = d3.svg.axis().scale(yAxisScale).orient('right');
var svg = null;
var svgXAxis, svgYAxis;
var rects;
var next = function (data) {
    index++;
    console.log(data.score);
    data.index=index;
    chartData.push(data);
    xAxisScale.domain([index+1-numOfBars, index+2]).range([0,chartWidth-chartMargin.left]);
    rects = svg.selectAll('.bar').data(chartData);
    //first draw new, then shift existing ones, last remove old ones
    rects.enter().append('rect').attr('class','bar').attr('x', function(d){return xAxisScale(d.index)}).attr('y', function(d){return Math.min(yAxisScale(d.score),yAxisScale(0))}).attr('width', rectWidth).attr('height',function(d){return Math.abs(yAxisScale(d.score)-yAxisScale(0))}).style('fill', function(d){return d.color});
    rects.transition().duration(500).ease("linear").attr('x', function(d){return xAxisScale(d.index)});
    rects.exit().remove();
    svgXAxis.transition().duration(500).ease('linear').call(d3.svg.axis().scale(xAxisScale).orient('bottom'));
};


var mapInitialization = function () {
    var myLatlng = new google.maps.LatLng(40,-70);
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: myLatlng,
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    createSentimap();

};

var startStreaming = function () {
    console.log("start socket connection");
    socket = io('http://52.4.26.85:9000');
    socket.on('ts', function (data) {
        if (data.keyword != keyword)
            console.log("pass");
        else
        {
            var tweetLocation = new google.maps.LatLng(data.lat,data.lng);
            var obj = {
                lat: data.lng,
                lng: data.lat,
                score: convertRange(data.sentiScore, [-1, 1], [0, 1])
            };
            console.log(obj);
            liveTweets.push(obj);
            tweetCount++;
            tweetCountAll++;
            console.log(liveTweets.length);
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
            heatMapData = {
                max: liveTweets.length,
                data: liveTweets
            };
            heatmap.setData(heatMapData);
            var newColor = obj.score>0.5?'red':'grey';
            var newData = {
              color: newColor,
              score: data.sentiScore
            };
            if(obj.score>0.5) {tweetPositiveCount++; updateCountPositive();}
            else if(obj.score<0.5) {tweetNegativeCount++; updateCountNegative();}
            next(newData);
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

};

var updateCountPositive = function () {
    var tmp, length;
    tmp=tweetPositiveCount.toString();
    if(tmp=='0'){
        for(var i=0;i<7;i++){
            digitsPositive[i].innerHTML = '-';
        }

    }
    length=tmp.length;
    for(var i=0;i<length;i++){
        digitsPositive[i].innerHTML = tmp.charAt(length-i-1);
    }
    for(var i=length;i<7;i++){
        digitsPositive[i].innerHTML = '-';
    }
};

var updateCountNegative = function () {
    var tmp, length;
    tmp=tweetNegativeCount.toString();
    if(tmp=='0'){
        for(var i=0;i<7;i++){
            digitsNegative[i].innerHTML = '-';
        }

    }
    length=tmp.length;
    for(var i=0;i<length;i++){
        digitsNegative[i].innerHTML = tmp.charAt(length-i-1);
    }
    for(var i=length;i<7;i++){
        digitsNegative[i].innerHTML = '-';
    }
};

var updateCountAll = function () {
    var tmp, length;
    tmp=tweetCountAll.toString();
    if(tmp=='0'){
        for(var i=0;i<7;i++){
            digits2[i].innerHTML = '-';
        }

    }
    length=tmp.length;
    for(var i=0;i<length;i++){
        digits2[i].innerHTML = tmp.charAt(length-i-1);
    }
    for(var i=length;i<7;i++){
        digits2[i].innerHTML = '-';
    }
};

var convertRange = function(value, interval1, interval2){
  return ( value - interval1[ 0 ] ) * ( interval2[ 1 ] - interval2[ 0 ] ) / ( interval1[ 1 ] - interval1[ 0 ] ) + interval2[ 0 ];
};

var createSentimap = function(){

    heatmap = new HeatmapOverlay(map,
        {
            // radius should be small ONLY if scaleRadius is true (or small radius is intended)
            "radius":5,
            "maxOpacity": 1,
            // scales the radius based on map zoom
            "scaleRadius": true,
            // if set to false the heatmap uses the global maximum for colorization
            // if activated: uses the data maximum within the current map boundaries
            //   (there will always be a red spot with useLocalExtremas true)
            "useLocalExtrema": true,
            "blur" : 1,
            gradient: {
                // enter n keys between 0 and 1 here
                // for gradient color customization
                '.3': '#FF0000',
                '.5': '#0000FF',
                '0.9': '#00FF00'
            },
            // which field name in your data represents the latitude - default "lat"
            latField: 'lng',
            // which field name in your data represents the longitude - default "lng"
            lngField: 'lat',
            // which field name in your data represents the data value - default "value"
            valueField: 'score'
        }
    );


};




