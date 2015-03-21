'use strict';
/**
 * Created by s0c5 on 26/02/15.
 */

var util    = require('util');
var tiper   = require('tiper');
var q       = require('q');
var mongoose = require('mongoose');
var _        = require('underscore');
var Parameter = function (){
    var self = this;

    this.validator = {
        onlyAlpha: /^\w+$/,
        onlyNumbers: /^\-{0,1}[0-9\.]+$/,
        onlyLetters: /^[a-zA-Z]+$/,
        onlyLowerLetters: /^[a-z]+$/,
        onlyUpperLetters: /^[A-Z]+$/,
        onlyHexaLetters: /^[A-Fa-f0-9]+$/
    };


    this.primitives = [
        'Number',
        'String',
        'Date',
        'ObjectId'
    ];

    this.notCast = [tiper.ARRAY, tiper.OBJECT];

    this.makeText = function(text, code) {
        return function(){
            var input = [];
            input.push(text);
            for(var key in arguments)
            {
                var value = arguments[key];
                input.push(value);
            }

            return {message: util.format.apply(util.format, input), code: code};
        }
    };


    this.customError = {
        notDefined: self.makeText("the Parameter \'%s\' need be defined", 400),
        notType: self.makeText("the Parameter \'%s\' need be of type \'%s\' ", 400),
        notCorrectFormat: self.makeText("the Parameter \'%s\' need have a correct format  ", 400)
    };
    this.isSchemaMongoose = function(obj){
        if(!tiper.is(obj, tiper.OBJECT)){
            return false;
        }
        if(obj.type  ){

            return true;
        }

        return false;
    }
    this.mongooseParser = function(model){

        if(tiper.getPrimitive(model) === 'VirtualType'){
            return undefined;
        }

        var isPirmitive = self.primitives.indexOf(tiper.getPrimitive(model)) != -1;

        if(isPirmitive){
            return  {type: model, required: true};
        }


        if(tiper.is(model, tiper.ARRAY)){

            return [self.mongooseParser(model[0])];
        }


        if(tiper.getPrimitive(model) !== 'model' && self.isSchemaMongoose(model) ){



            var fieldSchema = {
                type: undefined,
                required: false,
                format: undefined,
                default: undefined
            };


            fieldSchema.type = model.type || fieldSchema.type;

            if(model.type === undefined){
                return undefined;
            }

            if(tiper.getPrimitive(fieldSchema.type) === 'Mixed'){
                fieldSchema.type = '___MIXED___';
            }
            fieldSchema.format = String(model.validator) || fieldSchema.format;
            fieldSchema.format = model.enum !== undefined ? model.enum : fieldSchema.format;
            fieldSchema.default = model.default || fieldSchema.default;
            fieldSchema.required = model.required;
            if(fieldSchema.required === undefined){
                fieldSchema.required = false;
            }

            return fieldSchema;
        }

        var validate = {};
        var schema = model;
        if(tiper.getPrimitive(model) === 'model'){
            schema = model.schema.tree;
        }


        for(var field in schema){
            var options = schema[field];


            validate[field] = self.mongooseParser(options);


            if(validate[field] === undefined) delete validate[field];
            if(field === '__v') delete validate[field];
        }

        return validate;
    };
    this.outputMongoose = function(mongoose){

        var schema = mongoose.schema.paths;

        var obj = {};

        for(var field in schema){
            var options = schema[field];
            if(field === '__v')
                continue;

            obj[field] = options.instance;
            if(obj[field] === undefined){
                obj[field] = mongoose.schema.tree[field];
                if(tiper.is(obj[field], tiper.ARRAY)){
                    obj[field] = [ {type:  tiper.getPrimitive(obj[field][0].type) } ];
                }
                if(tiper.is(obj[field], tiper.OBJECT)){
                    obj[field] = tiper.getPrimitive(obj[field].type);
                }
            }
        }

        return obj;
    }
    this.outputParser = function(schema){

        return self.inputParserSchema(schema);
    };
    /*

     // options one
     f
     schema: {
     field: {
     type: String,
     format: validator,
     default: "foo",
     required: false, // true or false
     },
     field_two: [ { type: mixed, format: validator} ],
     field_three: String,
     field_four: {
     field_four_fiend: String
     }
     }

     // options two

     schema: [
     {Mongo Object}
     ]


     */
    this.isSchema = function(obj){
        if(!tiper.is(obj, tiper.OBJECT)){
            return false;
        }
        if(obj.type && (obj.format !== undefined ||  obj.default !== undefined || obj.required !== undefined ) ){
            return true;
        }

        return false;
    };

    this.validate = function(fieldName, fieldValue,  validate, sucess, error){
        var parameters = null;







        if(validate === '___MIXED___'){
            return sucess(fieldValue);
        }

        if(tiper.is(validate, tiper.ARRAY)) {

            parameters = [];

            if (!tiper.is(fieldValue, tiper.ARRAY)) {

                return error(self.customError.notType(fieldName, 'array'));
            }


            var validator = validate[0];
            var flag = false;
            for (var index in fieldValue) {

                var field = fieldValue[index];





                flag = false;
                self.validate(fieldName+'['+index+']', field, validator, function(param){


                    parameters.push(param);
                }, function(err){


                    error(err);
                    flag = true;
                });

                if(flag) return;
            }

            return sucess(parameters);
        }



        if(!tiper.is(validate, tiper.OBJECT) && tiper.getPrimitive(validate) !== 'model') {


            if(tiper.get(fieldValue) !== tiper.get(validate())){

                return error(self.customError.notType(fieldName, tiper.getPrimitive(validate)));
            }

            return sucess(fieldValue);
        }



        var isMongoModel = tiper.getPrimitive(validate) === 'model';

        if(isMongoModel){


            var tmp = self.mongooseParser(validate);
            for(var key in fieldValue){



                if(Object.keys(tmp).indexOf(key) === -1 && Object.keys(validate.schema.virtuals).indexOf(key) !== -1){

                    tmp[key] = '___MIXED___'

                }
            }
            validate = tmp;
        }



        var isSchema = self.isSchema(validate);

        if(isSchema){



            if(fieldValue === 'undefined'){
                fieldValue = undefined;
            }
            var defaultValue =(validate.default !== undefined && fieldValue === undefined) && !tiper.is(validate.default, tiper.FUNCTION);



            if (defaultValue){

                return sucess(validate.default);
            }




            var notRequiredAndNotDefault = validate.required === false && fieldValue === undefined;

            if(notRequiredAndNotDefault){

                return sucess(undefined);
            }

            var notDefined = validate.required && fieldValue === undefined || fieldValue === undefined && validate.required === undefined;

            if (notDefined){

                return error(self.customError.notDefined(fieldName));
            }

            var typeOfType  = tiper.get(validate.type());
            var typefieldValue  = tiper.get(fieldValue);






            if( typeOfType !== typefieldValue && tiper.getPrimitive(validate.type) !== 'ObjectId' ){


                return error(self.customError.notType(fieldName, tiper.getPrimitive(validate.type)));
            }
            if(tiper.getPrimitive(validate.type) === 'ObjectId' && !tiper.is(fieldValue, tiper.STRING) )
            {
                return error(self.customError.notType(fieldName, tiper.getPrimitive(validate.type)));
            }

            if(validate.format === undefined || validate.format === 'undefined'){

                return sucess(fieldValue);
            }

            var typeFormat  = tiper.get(validate.format);
            // validate the format
            var paramTmp = fieldValue;








            switch (typeFormat)
            {
                case tiper.FUNCTION:
                    if(!validate.format(paramTmp))
                        return error(self.customError.notCorrectFormat(fieldName));
                    break;
                case tiper.ARRAY:
                    if(!self.inArray(validate.format, paramTmp))
                        return error(self.customError.notCorrectFormat(fieldName));
                    break;
                case tiper.REGEX:
                    if(!String(paramTmp).match(validate.format))
                        return error(self.customError.notCorrectFormat(fieldName));
                    break;
                default :
                    throw 'format not recognized';
                    break;
            }
            return sucess(fieldValue);
        }

        if(!tiper.is(fieldValue, tiper.OBJECT)){
            return error(self.customError.notType(fieldName, 'object'));
        }
        // // console.log('the validator is not a schema and the input is schema too');
        parameters = {};
        var flag = false;

        for(var key in validate){
            var validator = validate[key];
            var fieldVal = fieldValue[key];



            self.validate(fieldName+'.'+key,fieldVal, validator, function(param){
                if(param === undefined)
                    return;
                parameters[key] = param;
            }, function(err){


                error(err);
                flag = true;
            });

            if(flag) return ;
        }




        return sucess(parameters);
    };

    this.inArray = function(array, item){
        return array.indexOf(item) !== -1;
    };

    this.inputParserSchema = function(schema){


        if(tiper.is(schema, tiper.ARRAY)){
            for(var index in schema){
                schema[index] = self.inputParserSchema(schema[index]);
            }
            return schema;
        }

        if(tiper.getPrimitive(schema) === 'model'){
            schema = self.mongooseParser(schema);
        }

        if(!tiper.is(schema, tiper.OBJECT)){
            return tiper.getPrimitive(schema);
        }


        var isSchema = self.isSchema(schema);
        if(isSchema){
            return tiper.getPrimitive(schema.type);
        }

        for(var key in schema){
            schema[key] = self.inputParserSchema(schema[key]);
            if(schema[key] === "Undefined"){
                delete schema[key];
            }
        }

        return schema;

    }
    this.inputParser = function(item){
        if(tiper.is(item, tiper.OBJECT)){
            item = [item];
        }


        for(var index in item ){
            var schema = item[index].schema;
            if(tiper.getPrimitive(schema) !== 'model'){
                schema = _.clone(schema);
            }

            item[index].schema = self.inputParserSchema(schema);

            if(tiper.is(item[index].Schema, tiper.OBJECT)){
                for(var key in item[index].schema){
                    if(key === '_id' || key === '_v' ){
                        delete item[index].schema[key];
                    }

                }
            }
        }
        return item;
    };
};



module.exports = new Parameter();

