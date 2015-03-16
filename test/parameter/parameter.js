/**
 * Created by s0c5 on 16/03/15.
 */



var should      = require('should');
var parameter   = require('../../lib/parameter').lib;

describe('parameter', function(){
    describe('type Format', function(){
       it('success the validator have a same type of input', function(done){
           parameter.validate('body', 'correct', String, function(prm){
               prm.should.equal('correct');
               done();
           }, function(err){
               done(err);
           })
       })
        it('fail the validator dont have a same type of input', function(done){
            parameter.validate('body', 'correct', Number, function(prm){

                done(prm);
            }, function(err){
                console.log(err);
                done();
            })
        })
    });
    describe('Schema Simple', function(){
        var badInput = {
            name: 123,
            year: "Foo"
        };
        var validInput = {
            name: "foo",
            year: 1
        };
        var schema = {
            name: String,
            year: Number
        };

        it('validate basic schema', function(done){
            parameter.validate('body', validInput, schema,
                function(prm){
                    done();
                },
                function(error){
                    done(error);
                });
        });
        it('invalidate basic schema', function(done){
            parameter.validate('body', badInput, schema,
                function(prm){
                    done(prm);
                },
                function(error){
                    done();
                });
        })
    });
    describe('schema with basic field schema', function(){
        var schema = {
            name: {
                type: String,
                required: true
            },
            years: {
                type: Number,
                default: 18
            }
        };
        var validInputOne = {
            name: "foo"
        };
        var validInputTwo = {
            name: "foo",
            years: 20
        };
        var badInputOne = {
        };
        var badInputTwo = {
            name: "foo",
            years: "123"
        };

        it('Default option test', function(done){
            parameter.validate('body', validInputOne, schema,
                function(prm){

                    prm.years.should.equal(18);
                    done();
                },
                function(error){
                    done(error);
                });
        });
        it('Test default option ignored with field definition', function(done){
            parameter.validate('body', validInputTwo, schema,
                function(prm){
                    prm.years.should.equal(20);
                    done();
                },
                function(error){
                    done(error);
                });
        });
        it('Error because the field is required and not defined', function(done){
            parameter.validate('body', badInputOne, schema,
                function(prm){
                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
        it('error because the field dont have a correct format', function(done){
            parameter.validate('body', badInputTwo, schema,
                function(prm){

                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
    });
    describe('test format options in schema', function(){
       var schemaFunctionFormat = {
           name: {
               type: String,
               format: function(x){
                   return x.length < 10;
               }
           }
       };
        var schemaArrayFormat = {
            name: {
                type: String,
                format: ['juan','david', 'alice']
            }
        };
        var schemaRegexFormat = {
            name: {
                type: String,
                format: /^[a-z]+$/
            }
        };
        var validInput = {
            name: 'david'
        };
        var badInput = {
            name: 'david thomson larry'
        };

        it('Success valid input in function format', function(done){
            parameter.validate('body', validInput, schemaFunctionFormat,
                function(prm){
                    done();
                },
                function(error){
                    done(error);
                });
        });
        it('fail with bad input in function format', function(done){
            parameter.validate('body', badInput, schemaFunctionFormat,
                function(prm){
                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
        it('success with valid input for a array format ', function(done){
            parameter.validate('body', validInput, schemaArrayFormat,
                function(prm){
                    done();
                },
                function(error){
                    console.log(error);
                    done(error);
                });
        });
        it('fail with bad input in array format', function(done){
            parameter.validate('body', badInput, schemaArrayFormat,
                function(prm){
                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
        it('success with valid input for regex format ', function(done){
            parameter.validate('body', validInput, schemaRegexFormat,
                function(prm){
                    done();
                },
                function(error){
                    console.log(error);
                    done(error);
                });
        });
        it('fail with bad input in regex format', function(done){
            parameter.validate('body', badInput, schemaRegexFormat,
                function(prm){
                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
    });

    describe('Array Schema', function(){
        describe('Array with Simple format', function(){
            var schema = [
                String
            ];

            var validInput = [ 'david', 'alice' ];
            var badInput = [ 'david', 12 ];

            it('success the input have the same format', function(done){
                parameter.validate('body', validInput, schema,
                    function(prm){
                        prm.length.should.equal(validInput.length);
                        prm[0].should.equal('david');
                        done();
                    },
                    function(error){
                        console.log(error);
                        done(error);
                    });
            });
            it('fail the input dont have the same format', function(done){
                parameter.validate('body', badInput, schema,
                    function(prm){
                        done(prm);
                    },
                    function(error){
                        console.log(error);
                        done();
                    });
            })
        });
        describe('Array with object validator  Schema',function(){
            var schema = [
                {
                    type: String,
                    format: function(x){ return x.length < 10}
                }
            ];

            var validInput = [ 'david', 'alice' ];
            var badInput = [ 'david', 12 ];

            it('success the input have the same format', function(done){
                parameter.validate('body', validInput, schema,
                    function(prm){
                        prm.length.should.equal(validInput.length);
                        prm[0].should.equal('david');
                        done();
                    },
                    function(error){
                        console.log(error);
                        done(error);
                    });
            });
            it('fail the input dont have the same format', function(done){
                parameter.validate('body', badInput, schema,
                    function(prm){
                        done(prm);
                    },
                    function(error){
                        console.log(error);
                        done();
                    });
            })

        });
        describe('Array with object  Schema',function(){
            var schemaBasic = [
                {
                    name: String,
                    years: Number
                }
            ];

            var schemaValidator = [
                {
                    name: {
                        type: String,
                        format: /^[a-z]+$/
                    },
                    years: Number
                }
            ];

            var validInput = [ {name: 'david', years: 20}, {name: 'lorena', years: 17} ];
            var badInput = [ {name: 'fuck 3', years: 100},'david', 12 ];

            it('success the input have the same format', function(done){
                parameter.validate('body', validInput, schemaBasic,
                    function(prm){
                        prm.length.should.equal(validInput.length);
                        prm[0].name.should.equal('david');
                        done();
                    },
                    function(error){
                        console.log(error);
                        done(error);
                    });
            });
            it('fail the input dont have the same format', function(done){
                parameter.validate('body', badInput, schemaBasic,
                    function(prm){
                        done(prm);
                    },
                    function(error){
                        console.log(error);
                        done();
                    });
            });
            it('success the input have the same format', function(done){
                parameter.validate('body', validInput, schemaValidator,
                    function(prm){
                        prm.length.should.equal(validInput.length);
                        prm[0].name.should.equal('david');
                        done();
                    },
                    function(error){
                        console.log(error);
                        done(error);
                    });
            });
            it('fail the input dont have the same format', function(done){
                parameter.validate('body', badInput, schemaValidator,
                    function(prm){
                        done(prm);
                    },
                    function(error){
                        console.log(error);
                        done();
                    });
            })
        });

    });

    describe('Mixed', function(){
        var schema = {
            name: {
                type: String,
                format: parameter.validator.onlyLetters
            },
            years: {
                type: Number,
                format: function(x){ return x > 18}
            },
            pets: [ {
                name: String,
                type: {
                    type: String,
                    format: ['cat', 'dog']
                }
            }],
            info: {
               state: String,
                country: {
                    type: String,
                    format: ['colombia', 'usa']
                }
            }
        };
        var validInputOne = {
            name: 'david',
            years: 19,
            pets: [
                {name: 'larry', type: 'dog'}
            ],
            info: {
                state: 'boyaca',
                country: 'colombia'
            }
        };
        var badInputOne = {
            name: 'david',
            years: 19,
            pets: [
                {name: 'larry', type: 'dog'},
                {name: 'larry', type: 'dogd'}
            ],
            info: {
                state: 'boyaca',
                country: 'colombia'
            }
        };
        it('fail with bad input in regex format', function(done){
            parameter.validate('body', validInputOne, schema,
                function(prm){
                    console.log(prm);

                    done();
                },
                function(error){
                    console.log(error);
                    done(error);
                });
        });
        it('fail this dont have a correct format', function(done){
            parameter.validate('body', badInputOne, schema,
                function(prm){
                    console.log(prm);
                    done(prm);
                },
                function(error){
                    console.log(error);
                    done();
                });
        });
    });
});
