'use strict';
/**
 * Created by s0c5 on 26/02/15.
 */

var Paramet3r = function (){


    this.validate = function(input, validate){

        for(var field in params){
            var option = validate[field];

            var fieldIsRequiredAndNotDefined;
            
            fieldIsRequiredAndNotDefined = option.required && input[field] === undefined;







        }
    };
};



module.exports = new Paramet3r();

