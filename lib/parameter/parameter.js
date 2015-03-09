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

            var isPirmitive = self.primitives.indexOf(tiper.getPrimitive(options)) !== -1

            if(isPirmitive){
                fieldSchema.type = options;
                validate[field] = fieldSchema;
                continue;
            }

            fieldSchema.type = options.type || fieldSchema.type
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
        }

        return obj;
    }
    this.outputParser = function(schema){

        if (tiper.getPrimitive(schema) === 'model'){
            return  self.outputMongoose(schema);
        }

        var isPrimitive = self.primitives.indexOf(tiper.getPrimitive(schema)) != -1;
        if (isPrimitive){
            return tiper.getPrimitive(schema);
        }

        if (tiper.is(schema, tiper.ARRAY)){

            var array = []
            for (var item in schema)
            {
                var value = schema[item];
                array.push(self.outputParser(value));
            }
            return array;
        }
        if (tiper.is(schema, tiper.OBJECT)){

            for(var key in schema){
                var value = schema[key];
                if(value.type !== undefined)
                {
                    var primitive = tiper.getPrimitive(value.type);
                    schema[key] = primitive;
                    continue;
                }
                schema[key] = self.outputParser(value);
            }
            return schema;
        }

        return schema;
    }
    this.validate = function(input, validate, success,  error){

        var parameters= {};
        var field;

        if (tiper.getPrimitive(validate) === 'model'){
            validate = self.mongooseParser(validate);
        }

        for(field in validate){

            var option = validate[field];
            var fieldValue = input[field];

            var isFunction = tiper.is(option, tiper.FUNCTION);
            var isPrimitive = self.primitives.indexOf(tiper.getPrimitive(option)) !== -1;

            if (isFunction && isPrimitive){

                if(fieldValue === undefined) {
                    return error(self.customError.notDefined(field));
                }

                var haveSameType = (fieldValue).constructor === option;

                if(!haveSameType){

                    return error(self.customError.notType(field, tiper.getPrimitive(option)));
                }

                parameters[field] = fieldValue;

                continue;
            }

            if (!tiper.is(option, tiper.OBJECT)){
                throw  'You need specify the schema options or schema type'
            }





            var defaultValue = option.default && fieldValue === undefined;

            if (defaultValue){
                parameters[field] = option.default;

                continue;
            }

            var notRequiredAndNotDefault = option.required === false && fieldValue === undefined;

            if(notRequiredAndNotDefault){
                parameters[field] = undefined;
                continue;
            }




            var notDefined = option.required && fieldValue === undefined || fieldValue === undefined && option.field === undefined;

            if (notDefined){
                return error(self.customError.notDefined(field));
            }

            // validate options

            if(option.type === undefined) {
                throw 'you need defined a type option for field';
            }





            var typeOfType  = tiper.get(option.type());
            var typefieldValue  = tiper.get(fieldValue);

            var noNeedBeCasted = self.notCast.indexOf(typefieldValue) != -1;

            if(noNeedBeCasted){
                if( typeOfType !== typefieldValue )
                {
                    return error(self.customError.notType(field, tiper.getPrimitive(option.type)));
                }
                parameters[field] = fieldValue;
            }
            else{
                try{
                    parameters[field] = tiper.cast(fieldValue, typeOfType);
                }
                catch(err){
                    return error(self.customError.notType(field, tiper.getPrimitive(option.type)));
                }

            }

            if(option.format === undefined){
                continue;
            }
            var typeFormat  = tiper.get(option.format);
            // validate the format 
            var paramTmp = parameters[field];


            switch (typeFormat)
            {
                case tiper.FUNCTION:
                    if(!option.format(paramTmp))
                        return error(self.customError.notCorrectFormat(field));
                    break;
                case tiper.ARRAY:
                    if(!self.inArray(option.format, paramTmp))
                        return error(self.customError.notCorrectFormat(field));
                    break;
                case tiper.OBJECT:
                    if(!option.format(paramTmp))
                        return error(self.customError.notCorrectFormat(field));
                    break;
                case tiper.REGEX:
                    if(!String(paramTmp).match(option.format))
                        return error(self.customError.notCorrectFormat(field));
                    break;
                default :
                    throw 'format not recognized';
                    break;
            }

        }
        console.log(parameters);
        success(parameters);
    };
    this.formatObject = function(schema, object){

        if(tiper.get(schema) === tiper.ARRAY){
            if (tiper.get(object) !== tiper.ARRAY){
                return false;
            }

            return true;
        }

        for(var key in schema){

            if(object[key] !== undefined){
                return false;
            }

            var valueSchema = schema[key];
            var valueObject = object[key];

            var typeSchema  = tiper.get(valueSchema());
            var typeObject  = tiper.get(valueObject);

            var isObject   = tiper.get(valueSchema) === tiper.OBJECT;

            if(isObject) {

                if(typeObject !== tiper.OBJECT)
                    return false;
                if(!self.formatObject(valueSchema, valueObject))
                    return false;

                continue;
            }

            var isArray     = tiper.get(valueSchema) === tiper.ARRAY;

            if(isArray){
                if(!self.formatObject(valueSchema, valueObject))
                    return false;
            };

            if(typeObject !== typeSchema)
                return false;
        }
        return true;
    };
    this.inArray = function(array, item){
        return array.indexOf(item) !== -1;
    };
    this.inputParser = function(item){
        if(tiper.is(item, tiper.OBJECT)){
            item = [item];
        }
        var parse = [];
        for(var index in item ){
            var tmp = item[index];
            if(tiper.getPrimitive(tmp.schema) === 'model')
            {
                tmp.schema = self.mongooseParser(tmp.schema);
                for(var field in tmp.schema){
                    var options = tmp.schema[field];
                    if(String(options.format) === 'undefined'){

                        delete options.format;
                    }
                    if(field === '__v'){
                        delete tmp.schema[field];
                    }
                    if(field === '_id'){
                        delete tmp.schema[field];
                    }

                }
            }
            parse.push(tmp);
        }
        return item;
    };
};



module.exports = new Parameter();

