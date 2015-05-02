/**
 * Created by xinyue on 4/7/15.
 */
'use strict'

var workerpool = require('workerpool');
var request = require('request');
var AWS = require('aws-sdk');
var awsInfo = require('../config/awsInfo')
AWS.config.update({
    'region': awsInfo.region,
    'accessKeyId': awsInfo.accessKey,
    'secretAccessKey': awsInfo.secretKey
});

var sns = new AWS.SNS();
var publishParams = {
    TopicArn: awsInfo.topicARN,
    MessageAttributes: {
    }
};

function sentimentAnalysis (message) {
    console.log(message);
    var requestUrl = "http://access.alchemyapi.com/calls/text/TextGetTextSentiment";
    var requestOptions = {
        alchemyApiKey: "ac8f1dc35b4ca767ece93398da0ad339766c4ab2",
        outputMode: "json"
    };
    var obj = JSON.parse(message);
    var text = obj.text;
    request({
        url: requestUrl,
        method: "GET",
        qs: {//query string for the get request
            apikey: requestOptions.alchemyApiKey,
            text: text,
            outputMode: requestOptions.outputMode
        }
    }, function(err, response, body){
        if(err){
            console.log("alchemy api error");
        }
        else{
            var tmp = JSON.parse(body).docSentiment;
            if(tmp!=undefined){
                if(tmp.type!=undefined){
                    obj.sentiment = tmp.type;
                    if(obj.sentiment=='neutral'){
                        obj.sentiScore = "0";
                    }
                    else obj.sentiScore = tmp.score;
                    publishParams.Message = JSON.stringify(obj);
                    console.log("push 1");
                    sns.publish(publishParams, function(err, data){
                    })
                }
            }

        }

    });
};


workerpool.worker({
    sentimentAnalysis: sentimentAnalysis
})