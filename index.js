'use strict';
/**
 * Created by s0c5 on 25/02/15.
 */

var express = require('express');
var _       = require('lodash');
var fs      = require('fs');
var path    = require('path');
var tiper   = require('tiper');


var parameter       = require('./lib/parameter');
var documentator    = require('./lib/documentation');

var Anabel = function (){

    this._documentation = {
    };

    this.opts = {
        dirName: __dirname,
        libPath: './lib',
        middleWarePath: './middleware',
        modelPath: './models'
    };

    this['validator'] = {};

    for(var key in parameter.lib.validator)
    {

        this['validator'][key] = parameter.lib.validator[key];
    }
    this.types = {
        ObjectId: {
            type: String,
            format: this.validator.onlyHexaLetters,
            required: true
        },
        Mixed: '___MIXED___',
        Query: this.Mixed
    }
};

Anabel.prototype.init = function(options){

    if(options){
        this.config(options);
    }

    var app = express();
    var self = this;

    Object.keys(app).map(function (value, index) {
        if(value === 'route'){

            self[value] = function(){
                if(tiper.is(arguments[0], tiper.ARRAY) || tiper.is(arguments[0], tiper.OBJECT)){
                    return self._route.apply(self, arguments);
                }
                return app[value].apply(app, arguments);
            };

            return;
        }
        if(Object.prototype.toString.call(app[value]) === '[object Function]')
        {
            self[value] = function(){
                app[value].apply(app, arguments);
            };
            return ;
        }
        self[value] = app[value];
    });
    this.app = app;
    return this;
};

Anabel.prototype.config = function(options){

    if(!options){
        options = {}
    }
    // default opts

    var self = this;
    Object.keys(options).map(function(value, index){
        self.opts[value] = options[value] || this.opts[value];
    });

    this.modelPath = this.opts.dirName + '/' + this.opts.modelPath + '/';
    this.libPath = this.opts.dirName + '/' + this.opts.libPath + '/';
    this.middlewarePath = this.opts.dirName + '/' + this.opts.middleWarePath;
};

Anabel.prototype.implement = function(libs){
    var self = this;
    libs.map(function(name, index){
        return require(self.libPath + '/' + name)
    });
};

Anabel.prototype.require = function (name) {
    return require(this.opts.dirName +'/' + name);
};
Anabel.prototype.getModels = function(){
    return this.getAllFiles(this.modelPath);
};
Anabel.prototype.getLibs = function(){
    return this.getAllFiles(this.libPath);
};
Anabel.prototype.getMiddlewares = function(){
    return this.getAllFiles(this.middlewarePath);
};
Anabel.prototype.getAllFiles = function(dirName){
    var exports = {};
    fs.readdirSync(dirName).map(function(file) {
        return path.join(dirName, file);
    }).filter(function(file) {
        return fs.statSync(file).isFile() && file !== __filename && (path.extname(file) === '.js' || path.extname(file) === '.coffee');
    }).forEach(function(file) {

        var name        = path.basename(file, path.extname(file));
        var capitalName = name[0].toUpperCase() + name.slice(1);
        exports[capitalName] = require(dirName + '/' + name);
    });
    return exports;
};
Anabel.prototype.useMiddleware = function (middleware){
    var self = this;

    if(tiper.is(middleware, tiper.FUNCTION)){
        return self.app.use(middleware);
    }

    if(tiper.is(middleware, tiper.STRING)){
        return self.app.use(require(this.middlewarePath + '/' + middleware));
    }

    if(tiper.is(middleware, tiper.ARRAY)){
        for(var index in middleware) {
            var mid = middleware[index];
            self.useMiddleware(mid);
        }
        return ;
    }

    throw new Error("the middleware doesnt have a correct format");
};

Anabel.prototype.middleware = function (middleware) {
    var self = this;
    var middles = [];

    if(tiper.is(middleware, tiper.FUNCTION)){
        return middleware;
    }

    if(tiper.is(middleware, tiper.STRING)){
        return require(this.middlewarePath + '/' + middleware);
    }

    if(tiper.is(middleware, tiper.ARRAY)){
        for(var index in middleware) {
            var mid = middleware[index];
            middles.push(self.middleware(mid));
        }
    }
    return middles;
};

Anabel.prototype.lib = function (lib) {
    return require(this.libPath + '/' + lib)
};

Anabel.prototype.model = function (model) {
    return require(this.modelPath + '/' + model)
};

Anabel.prototype.mountValidator = function(route, router){
    var input = route.options.input;

    var notCorrectType = tiper.get(input) !== tiper.ARRAY && tiper.get(input) !==  tiper.OBJECT;

    if(notCorrectType){
        throw  'incorrect format for input option';
    }
    if (tiper.is(input, tiper.OBJECT))
    {

        if(input.field === undefined)
            throw 'you must define a field';
        if(input.schema === undefined)
            throw  'you need specify an schema';
        if(tiper.getPrimitive(input.schema) === 'model'){
            input.schema = parameter.lib.mongooseParser(input.schema);
        }
        router[route.method](route.path, parameterController(input.field, input.schema));
    }else{

        for(var item in input)
        {
            item = input[item];

            if(item.field === undefined)
                throw 'you must define a field';

            if(item.schema === undefined)
                throw  'you need specify an schema';

            router[route.method](route.path, parameter.controller(item.field, item.schema));
        }
    }
};
Anabel.prototype.mountMiddle = function(middle, route, router){
    var self = this;
    var options = route.options;

    if(tiper.is(middle, tiper.FUNCTION)){
        return router[route.method](route.path, middle)
    }
    if(tiper.is(middle, tiper.ARRAY)){
        for(var i in middle)
        {
            var handler = middle[i];
            if(tiper.is(handler, tiper.STRING)){
                router[route.method](route.path, self.middleware(handler));
                continue;
            }
            if(tiper.is(handler, tiper.FUNCTION)){
                router[route.method](route.path, handler);
                continue;
            }
            throw 'handler type Dont support '
        }
        return;
    }
    throw 'handler type dont support';
};


Anabel.prototype.handler = function(handler){
    var self    = this;
    var array   = [];
    var pathHandler = './lib/handler';
    if(tiper.is(handler, tiper.STRING)){
        return [require(pathHandler + '/' +handler)];
    }

    if(tiper.is(handler, tiper.FUNCTION)){
        return [handler];
    }
    if(tiper.is(handler, tiper.ARRAY)){
        for(var index in handler){
            var tmp = handler[index];

            if(tiper.is(tmp, tiper.STRING)){
                array.push(require(pathHandler + '/' + tmp));
                continue;
            }
            if(tiper.is(tmp, tiper.FUNCTION)){
                array.push(tmp);
                continue;
            }
            throw new Error('The input handler doesnt have a correct format ');
        }
    }else {
        throw new Error('the input handler doesnt have a correct format');
    }

    return array;
};

Anabel.prototype.handleParser = function(handlers){
    var handle = [];var self = this;
    if(tiper.is(handlers, tiper.FUNCTION)){
        return [handlers];
    }
    if(tiper.is(handlers, tiper.ARRAY)){
        for(var index in handlers){
            var tmp = handlers[index];

            if(tiper.is(tmp, tiper.STRING)){
                handle.push(self.middleware(self.middlewarePath + '/' + tmp));
                continue;
            }
            if(tiper.is(tmp, tiper.FUNCTION)){
                handle.push(tmp);
                continue;
            }
            console.log("the handler is not support will be ignored");
        }
    }
    return handle;
};
Anabel.prototype.makeDocumentation = function(method, path, options){
    return {
        method: method,
        path: path,
        name: options.name? options.name : 'unknown',
        description: options.description ? options.description : 'unknown',
        input: options.input  ? parameter.lib.inputParser(options.input): 'unknown',
        output: options.output ? parameter.lib.outputParser(options.output) : 'unknown'
    }
}
Anabel.prototype._route = function(routes){
    var self = this;
    var router = express.Router();
    if(tiper.is(routes, tiper.OBJECT)){
        routes = [routes];
    }
    for(var j in routes){
        var route = routes[j];

        if(!route.path || !route.controller || !route.method  )
        {
            throw 'You need all parameters for the routes';
        }
        var options = {};

        route.method = route.method.toLowerCase();

        if(route.options !== undefined)
        {
            if(route.options.middleware !== undefined){
                self.mountMiddle(route.options.middleware, route, router);
            }
            if(route.options.input !== undefined){
                self.mountValidator(route, router);
            }
            options = route.options;
        }else{
            route.options = {};
        }

        if(router._documentation === undefined){
            router._documentation = [];
        }


        var documentation = self.makeDocumentation(route.method, route.path, options);

        router._documentation.push(documentation);


        router[route.method](route.path, route.controller, self.handleParser(route.options.handler));

    }
    return router;
};
Anabel.prototype.documentation = function(path, more){
    var self = this;
    var endPoints = documentator.lib.generate(self.app);

    if(more !== undefined){
       for(var index in more){
           var doc = more[index];
           if(endPoints[doc.name] === undefined){
               endPoints[doc.name] = [];
           }
           endPoints[doc.name].push(doc);
       }
    }
    self.app.get(path, documentator.controller(endPoints))
};


Anabel.prototype.Router = express.Router;

module.exports =  new Anabel();