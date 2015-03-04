'use strict'
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var twitter = require('twitter');
var app = express();
var socket = require('socket.io');
var Tweets = require('./models/db').Tweets;
require('events').EventEmitter.prototype._maxListeners = 10000;
//Setup twitter stream api
var twit = new twitter({
  consumer_key: 'rtCsZxPZlHvJ4aBePNFLLzMo3',
  consumer_secret: 'DF82HWTDLcvkJvrk8dFYTzZXr0ldhhZ7Qct27kHqeT8BdfPcst',
  access_token_key: '331556557-mjGMZpA84gLDXRVbW92DO7gh28KVLM8DOXKK95QR',
  access_token_secret: 'Q4T4OMO6vrnpzPi3YySRSgYRVrcPNJgUq7TrZDJwy6IRg'
});
var countdata = 0;
var geocount = 0;
var oldtime = new Date().getTime();
var bunth_data = [];
var create_stream = function(io){
  //Connect to twitter stream passing in filter for entire world.
  // var filter = {'locations':'-180,-90,180,90'};
  var keyword_string = 'good,java,song,phone';
  var keyword_list = keyword_string.split(',');
  console.log(keyword_list);
  var filter = {'track':'good,java,song,phone'};
    twit.stream('statuses/filter', filter, function(stream) {
        global_stream = stream;
        global_stream.on('data', function(data) {
          countdata++;
          if (data.coordinates){
              geocount++;
              var key = '';
              for (var x in keyword_list)
                {
                  if (data.text.indexOf(keyword_list[x]) > -1)
                    {key = keyword_list[x]; break;}
                }
              var obj = {'id': data.id, 'time': new Date(data.created_at), 'text': data.text, 'lat': data.coordinates.coordinates[0], 'lng': data.coordinates.coordinates[1], 'keyword': key};
              var record = new Tweets(obj);
              console.log(obj);
              record.save();
              io.emit('ts', record);
          }
        });
    });
}
var global_stream = null;
var config = require('./config');
var routes = require('./middlewares').routes;
var errorHandler = require('./middlewares').errorHandler;

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/views/index.html"); 
});
routes('', app);
app.use(errorHandler);


var server = app.listen(app.get('port'), app.get('host'), function () {
    console.log('Singleton server running at: %s:%d', app.get('host'), app.get('port'));
  });
//io need to be established after the app run

var io = socket.listen(server);
// io.sockets.setMaxListeners(0);
var count = 0;
//socket io is not related with connection anymore
create_stream(io);
//Create web sockets connection.
io.sockets.on('connection', function (socket) {
    console.log("connection established");
    count++;
    socket.on("disconnect", function(){
      console.log("disconnect");
      count--;
    });
    socket.emit("connected");
})
    
module.exports = app;

