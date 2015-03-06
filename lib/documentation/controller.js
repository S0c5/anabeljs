/**
 * Created by s0c5 on 5/03/15.
 */

var jade = require('jade');

var controller = function(endpoints){
    return function (req, res, next){
        console.log(endpoints);
        res.send(jade.renderFile(__dirname + '/view/documentation.jade', {endPoints: endpoints}))
    };
};


module.exports = controller;