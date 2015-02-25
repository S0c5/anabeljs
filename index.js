/**
 * Created by s0c5 on 25/02/15.
 */

var express = require('express');
var _       = require('lodash');


var Anabel = function (options){


    var  opts = {
        dirName: __dirname,
        libPath: './lib',
        middleWarePath: './middleware'
    };

    // default opts

    Object.keys(options).map(function(value, index){

       opts[value] = options[value] || opts[value];
    });

    _.assign(this, express());

};

Anabel.prototype.require = function (name) {
    return require(opts.dirName + name);
};


Anabel.prototype.middleware = function (name) {
    return require(opts.dirName + '/' +  opts.middleWarePath + '/' + name)
};

Anabel.prototype.lib = function (name) {
    return require(opts.dirName + '/' +  opts.libPath + '/' + name)
};


module.exports = Anabel;