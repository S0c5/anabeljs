/**
 * Created by s0c45 on 11/03/15.
 */

var tiper           = require('tiper');
var mongooseError   = require('./lib');


module.exports = function(err, req, res, next){
    if(tiper.getPrimitive(err) !== 'ValidationError'){
        next(err);
    }
    var friendlyError = mongooseError.handler(err);
    res.status(friendlyError.status);
    res.json(friendlyError);
};