// Config Resify
const restify = require('restify');
var server = restify.createServer();


// Mongo + Config
const MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
const db = {
  url : "mongodb+srv://ruanderson_vieira:sillas123@huggyteste-c5ptp.mongodb.net/test?retryWrites=true",
};


//Redis + Config
const redis = require('redis');
const jsonify = require('redis-jsonify');

var redisClient = jsonify(redis.createClient({host : 'redis-16564.c73.us-east-1-2.ec2.cloud.redislabs.com', port : 16564}));
redisClient.auth('XUBIIoEhmZiHwhwq81LIbn3C6Tw0hzo8',function(err,reply) {

});


//test conection redis 
redisClient.on('ready',function() {
  console.log("Redis is ready");
});
 redisClient.on('error',function() {
  console.log("Error in Redis");
});





// Get all
server.get('/', function(req, res, next) {
    MongoClient.connect(db.url,{ useNewUrlParser: true } ,(err,database) =>{

        if (err) return console.log(err);
        const crashDB = database.db('huggyteste')
        crashDB.collection('crash').find({}).toArray(function(err, docs) {
            if (err) return console.log(err);
            res.send(docs);

        });
        return next();
    });
    return next();
});

// Get by id
server.get('/:_id', function(req, res, next) {
    let urlId = req.path();

    //Check in redis
    function redisCheck(){
      redisClient.get(urlId, function (err, result) {
        //Check erro
        if(err){return console.log(err)};
        // Retun of redis
        if(result){res.send(result); console.log("Pegou do Redis");return next();}
        //Get in Mongo
        else {mongoGet()};
      });
    };
    redisCheck();


    // Save in redis
    function redisSave(docs){
      console.log(urlId);
        console.log(docs);
      redisClient.set(urlId, docs, function (err, result){
        if (err) return console.log(err);
      });
    };


    // Get in mongo
    function mongoGet(){
    MongoClient.connect(db.url,{ useNewUrlParser: true } ,(err,database) =>{

        if (err) return console.log(err);
        const crashDB = database.db('huggyteste');
        idCrash = new mongo.ObjectID(req.params._id);

        crashDB.collection('crash').find({ _id : idCrash}).toArray(function(err, docs) {
            if (err) return console.log(err);
            redisSave(docs);
            console.log("Pegou do Mongo");
            res.send(docs);
            return next();
        });
    });
  };
});

/// Creat  
server.post('/', function(req, res, next) {
    MongoClient.connect(db.url,{ useNewUrlParser: true } ,(err,database) =>{

        if (err) return console.log(err);
        const crashDB = database.db('huggyteste')
        myobj = req.body;
        crashDB.collection('crash').insertOne(myobj,function(err, docs) {
    
            if (err) return console.log(err);
            res.send("Save!");

        });
        return next();
    });

    return next();

});

// Update 
server.put('/:_id', function(req, res, next) {
  let urlId = "/" + req.params._id;

  MongoClient.connect(db.url,{ useNewUrlParser: true } ,(err,database) =>{

    if (err) return console.log(err);
    const crashDB = database.db('huggyteste');

    idCrash = new mongo.ObjectID(req.params._id);
    nameUp = req.body.name
    myobj = {$set:{ name: nameUp}};

    crashDB.collection('crash').updateOne({ _id : idCrash} , myobj, function(err, result){
        if (err) return console.log(err);
        console.log("Del in Mongo");

        //Check item
        redisClient.get(urlId, function (err, result) {
          if(err){return console.log(err)};
          if(result){
            redisClient.set(urlId, myobj, function (err, result){
              if (err) return console.log(err);
            });
          }
        });
        res.send("Del all");
        return next();
    }); 
});
});


// DEL in redis
server.del('/redis/:_id', function(req, res, next) {
  let urlId = "/" + req.params._id;

  redisClient.del(urlId, function (err, result) {
    if (err) return console.log(err);
    return res.send("Del in Redis")
  })

});


// DEL in mongo
server.del('/mongo/:_id', function(req, res, next) {
  let urlId = "/" + req.params._id;

  MongoClient.connect(db.url,{ useNewUrlParser: true } ,(err,database) =>{

    if (err) return console.log(err);
    const crashDB = database.db('huggyteste');

    idCrash = new mongo.ObjectID(req.params._id);
    myobj = req.body;
    crashDB.collection('crash').deleteOne({ _id : idCrash}, myobj ,function(err, result){
        if (err) return console.log(err);
        console.log("Del in Mongo");
        //Check item
        redisClient.get(urlId, function (err, result) {
          if(err){return console.log(err)};
          if(result){
            redisClient.del(urlId, function (err, result) {
              if (err) return console.log(err);
              console.log(result);
            });
        
          }
        });
        res.send("Del all");
        return next();
    });
});

  
});


// Config Resify
const port = 8002;
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Start Serve
server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
})