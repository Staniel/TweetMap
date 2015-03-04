'use strict';
var Tweets = require('../../models/tweets');

exports.list = function ( req, res, next ) {
  Tweets.list(req.params.keyword, function(err, result) {
    if (err) return next(err);
    res.status(200).send(result);
  })
}
