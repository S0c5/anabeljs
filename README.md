# anabeljs
Anabel Js, suit tool, and framework based on express.

#### why AnabelJs? 

the code for validate data in your controllers, the endpoint documentation, the exceptions handling is an work that need be more easy and too the structure of your app need be more logically!! when  you need each one of those things, you should use Anabejs.


1. Install Latest: 
```Bash
  $ npm install anabeljs
```
or 
```Bash
  $ npm install git+https://github.com/S0c5/anabeljs.git --save
```



### 1) Logic Structure

Directory Structure

```Bash
  Project/
    lib/
      sum.js
      super-library/
        index.js
      any.js
    models/
      user.js
      any.js
    middleware/
      test.js
    routes/
      user/
        index.js
        user.js
    app.js
```
when you want load a libraries, models, or any thing and you have a extended directory tree.

##### Before AnabelJs:
```JavaScript
  // load a library
  var sum = require('../../../lib/sum');
  // load a model 
  var user = require('../../../model/user');
  // load any thing
  require('../../../');
```

##### after Anabeljs:
```JavaScript
  // load library
  var sum = anabel.lib('sum');
  // load model 
  var user = anabel.model('user');
  // load custom middleware
  var customMiddle = anabel.middleware('customMiddle');
  (...) // more
```

### 1.1) Make a routing

you can use a route function in anabeljs for make a logically and useful routing, this functionality can provide options for validate the input of controller, error handling and documentation.

#### Example: 
```JavaScript
  /*
    file: routes/user/user.js
    description: this is an controller
  */
  var User = anabel.model(''
  
  exports.list: {
    permission: ['user:view'], // this is an example for implement a ACL 
    in: [{field: 'query', schema: anabeljs.types.Mixed}], // you can specify the schema for each field, see input validators section
    out: [User], // you can specify the output, you can use the schema of monngoose, see output schema for more information
    ctrl: function (req, res, next) {
            User.apiQuery(req.query).lean().exec(function(err, user){
                if(err) return next(err); // this exception is catched by the mongoose-error, and translated for the user
                res.status(200);
                res.json(user);
            });
      }
  }
  
  
  /*
    file: routes/user/index.js
    description: this is a router 
  */
  
  var user    = require('./user');
  
  var router  = anabel.route([ // your specify the routes with an objects array.
    {
        method: 'GET', // Method -
        path: '/', // PATH ._.
        controller: user.list.ctrl, // controller
        options: {
            name: 'user', // name of endpoint
            description: 'user list', // description
            input: user.list.in,  // the input schema, this is used for validate data that will be used in controller
            output: user.list.out, // the output schema
            middleware: ['oauth2', acl(role.list.permission)], // you use name of the middleware to load or a function
            handler: anabel.handler(['mongoose-error', 'general-handler', 'method-not-allowed']) // the handlers registered in anabeljs
          }
    }
  ]);
  
  module.exports = router; 
  
  /* next you can use the router */
  
  
  app.use('/user', router);
```


#### 1.1.1) Input Validator

the input validator is used for validate the data in a middleware before the main controller in your app, this mean that anabeljs will be to validate if the data have an correct schema, verifying the format, and you can add more options for example default values, or format validators, next if the data have the correct format this is passed to your controller and you can use that normaly, (req.query, req.body, req.params ..), if the data dont have a correct format, this is showed to the user in pretty form: 

##### Examples:

1) you need validate the schema human in the body of request

```JavaScript
  
  
  var human = { // shema pet
                name: {
                  type: String,
                  required: true,
                  format: /^[a-zA-Z ]$/// only letter with space
                },
                email: {
                  type: String,
                  required: true,
                  format: /VALIDATION EMAIL with REGEX/ // you can validate the email with an regex
                }
                gender: {
                  type: String,
                  format: ['f','m'] // only allow the items in the array
                },
                years: {
                  type: Number,
                  format: function(x) { // the human  only can have more that 18 years
                        return x > 18;
                      }
                  required: true
                },
                birthday: Date,
                children: [
                  {
                    name: String,
                    yearsOld: Number
                  }
                ]
            }
  ...
    // for create a human input
    input: [{
              field: 'body',
              schema: human
            }]
  
  ...
  // if you want input array of humans
    input: [{
              field: 'body',
              schema: [human]
            }]
  ... // allows /user?page=1
      // denied /user?page=s
    input: [{
              field: 'query',
              schema: {page: Number,  limit: Number }
            }]
  ...
    
```

##### can I use a mongoose schema like a validator?
yes,you can use the mongoose schema like a validator, for example: 

```JavaScript
  
  var userSchema = new mongoose.Schema({
      name: {
        type: String,
        enum: ['joe','sebastian'] // example for validate with enum
      },
      years:{
        type: Number,
        required: true
      }
      ...
  });
  
  ...
  
    var userSchema = anabel.model('user');
    ...
    // example input a only user
    input = [
      {
        field: 'body',
        schema: userSchema
      }
    ]
    ...
    input = [
      {
        field: 'body',
        schema: userSchema
      }
    ]
  ...
  
  // or if you 
  
```
##### what happened if the data dont have a correct format ?

The error will be showed to user, like that:

```JavaScript

  // no defined
  // status 400
  {"message": "the parameter body.name need be defined"}
  
  // dont have a correct type
  // status 400
  {"message": "the parameter body[0].children[1] need be of type 'Number' "}
  
  // The validator fail
  // status: 400
  {"message": "the parameter queery.email need have a correct format"}
  
```

##### Input validator:

```JavaScript
  // formats
  String
  Number
  Date
  Array
  anabel.types.ObjecId
  anabel.types.Mixed
  
  // schema basic
  
  var schema = {
    name: String,
    lastName: String,
    years: Number
  }
  
  // schema with format options
  
  var schema = {
    name: {
      type: String,
      format: anabel.validator.onlyLetters
      required: true
    },
    years: {
      type: String,
      format: function(x){return x>18};
    },
    gender: {
      type: String,
      format: ['f','m']
    },
    city: {
      type: String,
      default: 'None'
    }
  }
  
  // schema mixed
  
  var schema =  {
      basic: String,
      array: [
        {
          name: String,
          years: Number
        }
      ],
      mixed: {
          one: {
            type: string,
            defaut: 'dafaut value'
          }
          two: Number,
          three: [
            String
          ]
      }
      validatos: {
        one: {
          type: String,
          format: /[a-z]/ regular expresion
        },
        two:{
          type: Number,
          format: function(x) { return x>100 }
        },
        three: {
          type: String,
          format: ['a','b','c']
        }
      }
      
  }
```






