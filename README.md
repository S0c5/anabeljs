# anabeljs
Anabel Js, suit tool for express aplications

1. Install Latest: 
```Bash
  $ npm install anabeljs
```

##### before Anabel: 
```JavaScript
var express   = require('express');
var app       = express();

var userModel    = require('../../../moodels/Model'); // this ../../ is asdjasldasd
var sum      = require('../../../lib/sum');
var sub      = require('../../../lib/sub');
  
app.get('/sum', function(req, res, next){
    res.json({result: sum(2,2) })
});

app.get('/sub', function(req, res, next){
    res.json({result: sub(5, 3) });
});

app.get('/users', funtion(req, res, next){
    userModel.find({}, function(err, users){
        res.json(users);
    })
});


(...)
```

##### with Anabel:


```JavaScript
var anabel  = require('anabeljs');
var app = anabel.init();



app.config({
    dirName: __dirname,
    libPath: './lib',
    middleWarePath: './middleware',
    modelPath: './models'
  });

var userModel = app.model('user');
var sum       = app.lib('sum');
var sub       = app.lib('sub');

app.get('/sum', function(req, res, next){
    res.json({result: sum(2,2) })
});

app.get('/sub', function(req, res, next){
    res.json({result: sub(5, 3) });
});

app.get('/users', funtion(req, res, next){
    userModel.find({}, function(err, users){
        res.json(users);
    })
});
    


```






