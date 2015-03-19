/**
 * Created by s0c5 on 5/03/15.
 */


var parameter   = require('./parameter');


var controller  =function(location, schema) {
    return function(req, res, next) {
        // console.log('in parameter validator');
        parameter.validate(location, req[location], schema, function(parameters){
            req[location] = parameters;
            return next();
        }, function(error){
            res.status(error.code);
            res.json(error)
        });
    }
};



module.exports = controller;