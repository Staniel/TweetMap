'use strict';
var mongoose = require('mongoose');
var config = require('../config');
var url = config.mongodb.url;
// require("../schema/tweet");
var Schema = mongoose.Schema;

var TwitterSchema = new Schema({
    id: String,
    time: { type: Date, expires: 60*60 },
    text: String,
    lat: Number,
    lng: Number,
    keyword: String
}, {collection: 'tweet'}, { versionKey: false });

mongoose.model('Tweets', TwitterSchema);
console.log('Try to connect to MongoDB via Mongoose ...');
var conn = mongoose.createConnection(url);
conn.on('error', console.error.bind(console, 'Mongoose connection error:'));
conn.on('open', function (callback) {
  console.log("db connected");
});

exports.Tweets = conn.model("Tweets");
