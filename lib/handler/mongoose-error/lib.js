'use strict';
/**
 * Created by s0c5 on 11/03/15.
 */


var util    = require('util');

var MongooseError = function(){
    var self = this;

    this.makeMessage = function(message, code){
        return {message: message, status: code};
    };
    this.handleBycode = {
        11000: function(err){
            var fieldAndValue = err.err.match(/index: (.+)/)[1].split('  ')

            var value = fieldAndValue[1].match(/\{ : (.+) }/)[1]
            var field = fieldAndValue[0].split('$')[1]

            return self.makeMessage('duplicate key ' + value + ' in field "' + field+'"', 400);
        }
    };

    this.handler = function(err){

        if(err.code !== undefined && handler) return self.handleBycode(err.code);

        if(err.name === 'CastError') return self.makeMessage( err.path + ": need type " + err.type, 400);

        if(err.name === 'ValidationError'){

            var errorsFriendly = [];

            var messages = {
                'custom': '%s: %s',
                'required': "%s: is required.",
                'min': "%s: below minimum.",
                'max': "%s: above maximum.",
                'enum': "%s: not an allowed value.",
                'Number': '%s: need type be a number',
                "user defined": "%s: need be defined or have a invalid format"
            };

            var ref = err.errors;

            for (var field in ref) {
                var error = ref[field];

                if (!(error.kind in messages)) {
                    errorsFriendly.push(util.format(messages['custom'], error.path, error.kind));
                }else {
                    errorsFriendly.push(util.format(messages[error.kind], error.path));
                }
            }
            return self.makeMessage(errorsFriendly, 400);
        }

        return self.makeMessage(err.message, 500);
    }
};

module.exports = new MongooseError();