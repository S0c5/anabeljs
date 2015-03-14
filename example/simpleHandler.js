var anabel          = require('../');
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var documentation   = require('../lib/documentation/documentation');


var app = anabel.init({
    dirName: __dirname,
    libPath: './lib',
    middleWarePath: './middleware',
    modelPath: './models'
});

var sum = app.lib('sum');
var sub = app.lib('sub');


app.middleware(bodyParser.json());
app.middleware(bodyParser.urlencoded({extended: true}));
app.middleware(morgan('dev'));



var userModel = anabel.model('user');

var User = {
    create: {
        input: [  { field: 'body', schema: userModel } ],
        output : [ userModel],
        controller: function(req, res, next){
            return next({message: "error"});
            res.json({message: "hello doll7"});
        }
    }
};

var handler = function(err, req, res, next){
    console.log("this is a handler");
    res.json(err);
};

var middleWare = function(req, res, next){
    next();
};

var userRouter = anabel.route([
    {

        method: 'POST',
        path: '/',
        controller: User.create.controller,
        options: {
            name: 'user',
            description: 'create a new user',
            input: User.create.input,
            output: User.create.output
        }
    },
    {
        method: 'GET',
        path: '/:id',
        controller: User.create.controller,
        options: {
            name: 'user',
            description: 'retrieve a user by id',
            input: [],
            output: User.create.output,
            middleware: ['oauth2'],
            handler: anabel.handler(['mongoose-error'])
        }
    }
]);


app.use('/user', userRouter);
anabel.documentation('/docs');

app.listen(8888,function(){
    console.info("listen in 8888" )
});
