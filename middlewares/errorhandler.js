'use strict';

module.exports = function (err, req, res, next) {
  if(err) console.log('Error:', new Date());
  res.status(err.statusCode || err.status || 500);
  res.json(
      { code: err.statusCode, 
      	message: err.message
      }
  );
}
