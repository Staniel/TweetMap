'use strict'
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var twitter = require('twitter');
var app = express();
var socket = require('socket.io');
var Tweets = require('./models/db').Tweets;
var AWS = require('aws-sdk');
var util = require('util');
var http = require('http');
var workerpool = require('workerpool');
var awsInfo = require('./config/awsInfo');
var events = require('events');

AWS.config.update({
    'region': awsInfo.region,
    'accessKeyId': awsInfo.accessKey,
    'secretAccessKey': awsInfo.secretKey
});

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
var global_stream = null;
var sqsParams = {
    QueueUrl: awsInfo.queueUrl,
    Attributes: {
        'Policy': JSON.stringify({})
    }
};
var sqs = new AWS.SQS();
sqs.setQueueAttributes(sqsParams, function(err, result) {
    if (err !== null) {
        console.log(util.inspect(err));
        return;
    }
    //console.log(util.inspect(result));
});
var sqsSendParams = {
    MessageBody: "",
    QueueUrl: awsInfo.queueUrl
};



var create_stream = function(){
  //Connect to twitter stream passing in filter for entire world.
  // var filter = {'locations':'-180,-90,180,90'};
  var keyword_string = 'good,sad,song,phone';
  var keyword_list = keyword_string.split(',');
  var filter = {'track':'good,sad,song,phone'};
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
              if(key!='') {
                  var obj = {'id': data.id, 'time': new Date(data.created_at), 'text': data.text, 'lat': data.coordinates.coordinates[1], 'lng': data.coordinates.coordinates[0], 'keyword': key, 'sentiment': "", 'sentiScore': 0};
                  //var record = new Tweets(obj);
                  //record.save();
                  //io.emit('ts', record);
                  sqsSendParams.MessageBody = JSON.stringify(obj);
                  sqs.sendMessage(sqsSendParams, function(err, data){
                      if(err) console.log(err);
                  });
              }
          }
        });
    });
}

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

//var io = socket.listen(server);
// io.sockets.setMaxListeners(0);
//var count = 0;
//socket io is not related with connection anymore

create_stream();
//Create web sockets connection.
//io.sockets.on('connection', function (socket) {
//    console.log("connection established");
//    count++;
//    socket.on("disconnect", function(){
//      console.log("disconnect");
//      count--;
//    });
//    socket.emit("connected");
//})


//use worker pool and Alchemy to conduct sentiment analysis for tweet fetched from sqs.
var workerPool = workerpool.pool(__dirname+'/helpers/worker.js', {maxWorkers: 5});
var sqsGetParams = {
    QueueUrl: awsInfo.queueUrl,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 10
};


//create an event emitter to get message from SQS if it's not empty

var SQSListenEmitter = new events.EventEmitter();
var getMessageFromSQS = function(){
    var sqsGetAttributesParams = {
        QueueUrl: awsInfo.queueUrl,
        AttributeNames: [
            'ApproximateNumberOfMessages'
        ]
    };

    sqs.getQueueAttributes(sqsGetAttributesParams, function(err,data){
        if(data.Attributes.ApproximateNumberOfMessages>5){
            sqs.receiveMessage(sqsGetParams, function(err, data){

                if(data.Messages){
                    var message = data.Messages[0],
                        body = JSON.parse(message.Body);
                    workerPool.exec('sentimentAnalysis',[JSON.stringify(body)]);
                    removeFromQueue(message);

                }
            });
        }
    });
};

SQSListenEmitter.on('NotEmpty', getMessageFromSQS);
setInterval(function(){SQSListenEmitter.emit('NotEmpty');},1000);


var removeFromQueue = function(message) {
    sqs.deleteMessage({
        QueueUrl: awsInfo.queueUrl,
        ReceiptHandle: message.ReceiptHandle
    }, function(err, data) {
        // If we errored, tell us that we did
        err && console.log(err);
    });
};





//create aws sns and make the client endpoint subscribe the topic
var sns = new AWS.SNS();
var snsParams = {
    Protocol: 'http',
    TopicArn: awsInfo.topicARN,
    Endpoint: 'http://52.4.26.85:9000/receive'
};

sns.subscribe(snsParams, function(err,data){
    console.log(data);
});




module.exports = app;

