var anabel  = require('../');

var app = anabel.init({
    dirName: __dirname,
    libPath: './lib',
    middleWarePath: './middleware',
    modelPath: './models'
});


app.get('/', function(req, res, next){
   res.json({message: "Anabel JS"});
});

app.get('/sum', function(req, res, next){
    var sum = app.lib('sum');
    res.json({result: sum(2,2) })
});

app.get('/sub', function(req, res, next){
    var sub = app.lib('sub');
    res.json({result: sub(5, 3) });
});


app.listen(8888,function(){
    console.info("listen in 8888" )
});
