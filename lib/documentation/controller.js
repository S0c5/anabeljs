/**
 * Created by s0c5 on 5/03/15.
 */

var ejs = require('ejs');

var controller = function(endpoints){
    return function (req, res, next){
        console.log(endpoints.user[0].input);
        ejs.renderFile(__dirname + '/view/documentation.ejs', {docs: endpoints}, function(err, html){
            if(err)
                return res.send(err);
            res.send(html);
        })
    };
};


module.exports = controller;