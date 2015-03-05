var anabel  = require('../');
var morgan  = require('morgan');
var bodyParser = require('body-parser');



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



app.get('/', function(req, res, next){
   res.json({message: "Anabel JS"});
});

app.get('/sum', function(req, res, next){
    res.json({result: sum(2,2) })
});

app.get('/sub', function(req, res, next){

    res.json({result: sub(5, 3) });
});

var Books = {};
var Users  = {};

var book = function(){
    
    this.create = function(req, res, next){
        var book    = req.body;
        Books[book.serial] = book;
        res.json(book);
    };
    console.log(anabel.validator);
    this.create.input = [
        {
            field: 'body',
            schema: {
                serial: {
                    type: Number,
                    required: true,
                    format: function(x){ return x>100}
                },
                tittle: String,
                author: {
                    type: String
                }
            }
        }
    ];
    this.create.output = {
        serial: Number,
        tittle: String,
        author: String
    };
};

var bookCRUD = new book();


var userModel = anabel.model('user');

var user = function(){

    this.create = function(req, res, next){
        var user    = req.body;
        Users[user.cedula] = user;
        res.json(user);
    };
    
    this.create.input = [
        {
            field: 'body',
            schema: userModel
        }
    ];
    this.create.output = {
        serial: Number,
        tittle: String,
        author: String
    };
};

var userCRUD = new user();
anabel.route([
    {
        method: 'POST',
        path: '/book',
        description: 'create a new book',
        controller: bookCRUD.create,
        input: bookCRUD.create.input,
        output: bookCRUD.create.output
    },
    {
        method: 'POST',
        path: '/user',
        description: 'create a new user',
        controller: userCRUD.create,
        input: userCRUD.create.input,
        output: userCRUD.create.output
    }
]);

app.listen(8889,function(){
    console.info("listen in 8888" )
});
