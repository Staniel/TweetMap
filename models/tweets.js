'use strict';

var Tweets=require("./db").Tweets;

exports.list = function(keyword, callback){
  Tweets.find({'keyword': keyword}
    , function(err, result){
    if(err) return callback(err);
    return callback(null, result);
    });
}
