'use strict';
/**
 * Created by s0c5 on 25/02/15.
 */

var express = require('express');
var _       = require('lodash');
var fs      = require('fs');
var path    = require('path');
var tiper   = require('tiper');

var Anabel = function (){
    this.opts = {
        dirName: __dirname,
        libPath: './lib',
        middleWarePath: './middleware',
        modelPath: './models'
    };
};

Anabel.prototype.init = function(options){
    
    if(options){
        this.config(options);
    }

    var app = express();
    var self = this;
    
    Object.keys(app).map(function (value, index) {

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
        return require(self.libPath)
    });
};

Anabel.prototype.require = function (name) {
    return require(this.opts.dirName +'/' + name);
};
Anabel.prototype.getModels = function(){
    this.getAllFiles(this.modelPath);
};
Anabel.prototype.getLibs = function(){
    this.getAllFiles(this.libPath);
};
Anabel.prototype.getMiddlewares = function(){
    this.getAllFiles(this.middlewarePath);
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
Anabel.prototype.useMiddleware = function (name){
    this.app.use(this.middleware(name));
};

Anabel.prototype.middleware = function (middleware) {
    if(tiper.is(middleware, tiper.FUNCTION))
    {
        return this.app.use(middleware);
    }
    
    if(!tiper.is(middleware, tiper.STRING))
    {
        throw 'you can not load the middleware, this can be a function or a string type'
    }
    return require(this.middlewarePath + '/' + middleware);
};

Anabel.prototype.lib = function (lib) {
    return require(this.libPath + '/' + lib)
};

Anabel.prototype.model = function (model) {
    return require(this.modelPath + '/' + model)
};


module.exports = exports = new Anabel();