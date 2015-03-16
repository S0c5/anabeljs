'use strict';
/**
 * Created by s0c5 on 26/02/15.
 */


var mongoose    = require('mongoose');
var should      = require('should');

var faker       = require('faker');
var handler     = require('../../lib/handler');
var config      = require('./config');
var tiper       = require('tiper');


var mongooseError   = require('../../lib/handler/mongoose-error/lib');
var UserModel       = require('./models/user');

var BadUser = {
    cedula: "123SAD",
    type: "f",
    name: "_(*",
    password: "34D|"
};


// load models
describe('Prepare Database', function(){
    it('connect', function(done){
        mongoose.connect(config.db, function(err, connection){
            if(err){

                throw 'Error on connect to database';
            }
            return done();
        });
    });
    it('drop database', function(done){

        mongoose.connection.db.dropDatabase(function(err){
            if(err)
                return done(err);
            done();
        });

    });
});
describe('Mongoo-http-error', function(){
    it('cast Error', function(done){
        var user = new UserModel(BadUser);

        user.save(function(err, user){
            if(err){
                var friendly = mongooseError.handler(err);

                if( friendly.message === 'cedula: need type number' && friendly.status === 400 ){
                    BadUser.cedula = 1234;
                    return done();
                }

                return done("error Frienly error");
            }
            return done("this should be an error");
        });
    });
    it('Enum Error', function(done){
        var user = new UserModel(BadUser);

        user.save(function(err, user){
            if(err){
                var friendly  = mongooseError.handler(err);
                if( friendly.message.length === 3  && friendly.status === 400 ){
                    BadUser.type  = "a";
                    return done();
                }
                return done("error Frienly error");
            }
            return done("error Frienly error");
        });
    });
    it('Error format Regex', function(done){

        var user = new UserModel(BadUser);

        user.save(function(err, user){
            if(err){

                var friendly  = mongooseError.handler(err);

                if( friendly.message.length === 2  && friendly.status === 400 ){
                    BadUser.name  = "david barinas";
                    return done();
                }
                return done(new Error("un catch error"));
            }
            return done(new Error("not should save"));
        });
    });
    it('validator error Regex', function(done){

        var user = new UserModel(BadUser);

        user.save(function(err, user){
            if(err){

                var friendly  = mongooseError.handler(err);

                if( friendly.message.length === 1  && friendly.status === 400 ){
                    BadUser.password = '1234';
                    return done();
                }

            }
            return done(new Error("not should save"));
        });
    });
    it('Enum Error', function(done){

        var user = new UserModel(BadUser);

        user.save(function(err, user){
            if(err){
                done(new Error("the model dont shoulded store :( "));
            }
            return done();
        });
    });
});