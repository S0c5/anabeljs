/**
 * Created by s0c5 on 25/02/15.
 */

var express = require('express');
var _       = require('lodash');


var Anabel = function (){
    this.opts = {
        dirName: __dirname,
        libPath: './lib',
        middleWarePath: './middleware',
        modelPath: './models'
    };
};

Anabel.prototype.init = function(){

    var app = express();
    var self = this;

    Object.keys(app).map(function (value, index) {

        if(Object.prototype.toString.call(app[value]) == '[object Function]')
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

    if(!options)
    {
        options = {}
    }
    // default opts

    self = this;
    Object.keys(options).map(function(value, index){
        self.opts[value] = options[value] || this.opts[value];
    });
};

Anabel.prototype.require = function (name) {
    return require(opts.dirName + name);
};


Anabel.prototype.useMiddleware = function (name){
    this.app.use(this.middleware(name));
};

Anabel.prototype.middleware = function (name) {
    return require(this.opts.dirName + '/' +  this.opts.middleWarePath + '/' + name);
};

Anabel.prototype.lib = function (name) {
    return require(this.opts.dirName + '/' +  this.opts.libPath + '/' + name)
};

Anabel.prototype.model = function (name) {
    return require(this.opts.dirName + '/' +  this.opts.modelPath + '/' + name)
};


module.exports = exports = new Anabel();