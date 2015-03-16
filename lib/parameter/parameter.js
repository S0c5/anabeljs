'use strict';
/**
 * Created by s0c5 on 26/02/15.
 */

var util    = require('util');
var tiper   = require('tiper');
var q       = require('q');
var mongoose = require('mongoose');

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
        'Array',
        'Date',
        'Object'
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
    this.mongooseParser = function(model){
        var validate = {};
        var schema = model.schema.tree;

        for(var field in schema){

            var options = schema[field];


            var fieldSchema = {
                type: undefined,
                required: false,
                format: undefined,
                default: undefined
            };

            var isPirmitive = !tiper.is(options, tiper.OBJECT);

            if(isPirmitive){
                fieldSchema.type = options;
                validate[field] = fieldSchema;
                continue;
            }
            console.log('field ' + field);
            console.log('type: ' + options.type);
            fieldSchema.type = options.type || fieldSchema.type;
            if(options.type === undefined){

                continue;
            }
            if(tiper.getPrimitive(fieldSchema.type) === 'Mixed'){
                fieldSchema.type = '___MIXED___';
            }
            fieldSchema.format = String(options.validator) || fieldSchema.format;
            fieldSchema.format = options.enum !== undefined ? options.enum : fieldSchema.format;
            fieldSchema.default = options.default || fieldSchema.default;
            fieldSchema.required = options.required || fieldSchema.required;

            validate[field] = fieldSchema;
        }

        return validate;
    }
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
        // console.log('input Name: '+ fieldName);

        // console.log('input value: ');
        // console.log(fieldValue);
        // console.log('validator: ' );
        // console.log(validate);

        if(validate === '___MIXED___'){
            return sucess(fieldValue);
        }

        if(tiper.is(validate, tiper.ARRAY)) {
            // console.log('is Array ');
            parameters = [];

            if (!tiper.is(fieldValue, tiper.ARRAY)) {
                // console.log('error input isnt array');
                return error(self.customError.notType(fieldName, 'array'));
            }
            // console.log('input is array');

            var validator = validate[0];
            var flag = false;
            for (var index in fieldValue) {

                var field = fieldValue[index];

                // console.log('test')
                // console.log(field);
                // console.log('validator');
                // console.log(validator);
                flag = false;
                self.validate(fieldName+'['+index+']', field, validator, function(param){
                    // console.log('correct');
                    // console.log(param);
                    parameters.push(param);
                }, function(err){
                    // console.log('error in validator array for field')
                    // console.log(err);
                    error(err);
                    flag = true;
                });

                if(flag) return;
            }
            // console.log('success');
            return sucess(parameters);
        }
        if(!tiper.is(validate, tiper.OBJECT)) {
            // console.log('the input is not a array, and not object');

            if(tiper.get(fieldValue) !== tiper.get(validate())){
                // console.log('doent have a same type');
                return error(self.customError.notType(fieldName, tiper.getPrimitive(validate)));
            }
            // console.log('success');
            return sucess(fieldValue);
        }



        var isMongoModel = tiper.getPrimitive(validate) === 'model';

        if(isMongoModel){
            validate = self.mongooseParser(validate);
        }

        var isSchema = self.isSchema(validate);

        if(isSchema){
            // console.log('the valdator is a schema');
            var defaultValue = validate.default && fieldValue === undefined;

            if (defaultValue){
                // console.log('the schema have a default value and field Value is not defined');
                return sucess(validate.default);
            }

            var notRequiredAndNotDefault = validate.required === false && fieldValue === undefined;

            if(notRequiredAndNotDefault){
                // console.log('the input is not required and default is not defined');
                return sucess(undefined);
            }

            var notDefined = validate.required && fieldValue === undefined || fieldValue === undefined && validate.required === undefined;

            if (notDefined){
                // console.log('error the input is not defined');
                return error(self.customError.notDefined(fieldName));
            }

            var typeOfType  = tiper.get(validate.type());
            var typefieldValue  = tiper.get(fieldValue);
            // console.log('test the types of schema and input');
            if( typeOfType !== typefieldValue ){
                // console.log('error the input doesnt have a same type of schema');
                return error(self.customError.notType(fieldName, tiper.getPrimitive(validate.type)));
            }


            if(validate.format === undefined){
                // console.log('not need have a valid format');
                return sucess(fieldValue);
            }

            var typeFormat  = tiper.get(validate.format);
            // validate the format
            var paramTmp = fieldValue;

            // console.log('test format');
            // console.log(typeFormat);
            // console.log(validate.format);
            // console.log('input');
            // console.log(paramTmp);
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
        // console.log('the validator is not a schema and the input is schema too');
        parameters = {};
        var flag = false;
        for(var key in validate){
            var validator = validate[key];
            var fieldVal = fieldValue[key];

            self.validate(fieldName+'.'+key,fieldVal, validator, function(param){
                parameters[key] = param;
            }, function(err){
                // console.log('validate error');
                // console.log(err);
                error(err);
                flag = true;
            });
            if(flag) return ;
        }
        // console.log('sucess');
        return sucess(parameters);
    };

    this.inArray = function(array, item){
        return array.indexOf(item) !== -1;
    };

    this.inputParserSchema = function(schema){
        console.log(schema);
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
        }

        return schema;

    }
    this.inputParser = function(item){
        if(tiper.is(item, tiper.OBJECT)){
            item = [item];
        }

        for(var index in item ){
            item[index].schema = self.inputParserSchema(item[index].schema);
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

