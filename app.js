// Config Resify
const restify = require('restify');
var server = restify.createServer();


// Mongo + Config
global.db = require('./db');
var mongo = require('mongodb');


//Redis + Config
const redis = require('redis');

var redisClient = redis.createClient({ host: 'redis-16564.c73.us-east-1-2.ec2.cloud.redislabs.com', port: 16564 });
redisClient.auth('XUBIIoEhmZiHwhwq81LIbn3C6Tw0hzo8', function (err, reply) {

});


//test conection redis 
redisClient.on('ready', function () {
  console.log("Redis is ready");
});
redisClient.on('error', function () {
  console.log("Error in Redis");
});





// Get all
server.get('/', function (req, res, next) {
  let urlId = req.path() + "all";

  //Check in redis
  function redisCheck() {
    redisClient.get(urlId, function (err, result) {
      //Check erro
      if (err) { return console.log(err) };
      // Retun of redis
      if (result) { res.send(JSON.parse(result)); console.log("Pegou todos do Redis"); return next(); }
      //Get in Mongo
      else { mongoGet() };
    });
  };
  redisCheck();
  // Save in redis
  function redisSave(docs) {
    redisClient.set(urlId, JSON.stringify(docs), function (err, result) {
      if (err) return console.log(err);
    });
  };
  // Get in mongo
  function mongoGet() {
    global.conn.collection('crash').find().toArray(function (err, docs) {
      if (err) return console.log(err);
      redisSave(docs)
      console.log("Pegou todos do Mongo");
      res.send(docs);
      return next();
    });
  };
});



// Get by id
server.get('/:_id', function (req, res, next) {
  let urlId = req.path();

  //Check in redis
  function redisCheck() {
    redisClient.get(urlId, function (err, result) {
      //Check erro
      if (err) { return console.log(err) };
      // Retun of redis
      if (result) { console.log("Pegou do Redis"); return res.send(JSON.parse(result)); }
      //Get in Mongo
      else { mongoGet() };
    });
  };
  redisCheck();


  // Save in redis
  function redisSave(docs) {
    redisClient.set(urlId, JSON.stringify(docs), function (err, result) {
      if (err) return console.log(err);
    });
  };


  // Get in mongo
  function mongoGet() {
    idCrash = new mongo.ObjectID(req.params._id);

    global.conn.collection('crash').find({ _id: idCrash }).toArray(function (err, docs) {
      if (err) return console.log(err);
      redisSave(docs);
      console.log("Pegou do Mongo");
      res.send(docs);
      return next();
    });
  };
});




/// Creat  
server.post('/', function (req, res, next) {
  myobj = req.body;
  global.conn.collection('crash').insertOne(myobj, function (err, docs) {
    if (err) return console.log(err);
    return res.send("Save!");
  });
});



// Update 
server.put('/:_id', function (req, res, next) {
  let url = "/";
  let urlId = "/" + req.params._id;

  idCrash = new mongo.ObjectID(req.params._id);
  nameUp = req.body.name
  statusUp = req.body.status
  myobj = { $set: { name: nameUp, status: statusUp } };

  global.conn.collection('crash').updateOne({ _id: idCrash }, myobj, function (err, result) {
    if (err) return console.log(err);
    console.log("Update in Mongo");

    //Update item by id
    redisClient.get(urlId, function (err, result) {
      if (err) { return console.log(err) };
      if (result) {
        redisClient.set(urlId, JSON.stringify(myobj.$set), function (err, result) {
          if (err) return console.log(err);
        });
      }
    });

    //Update all itens 
    redisClient.get(url, function (err, result) {
      if (err) { return console.log(err) };
      if (result) {
        for (i = 0; i < result.length; i++) {
          if (result[i]._id == urlId) {
            result[i] = myobj.$set;
        };

            redisClient.set(urlId, myobj.$set, function (err, result) {
              if (err) { return console.log(err) };
              if (result) { res.send(JSON.parse(result));}
            });
});
        
res.send("Update");
return next();
    }); 
});



// DEL in redis
server.del('/redis/:_id', function (req, res, next) {
  let urlId = "/" + req.params._id;
  redisClient.del(urlId, function (err, result) {
    if (err) return console.log(err);
    return res.send("Del in Redis")
  })

});



// DEL in mongo
server.del('/mongo/:_id', function (req, res, next) {
  let urlId = "/" + req.params._id;
  idCrash = new mongo.ObjectID(req.params._id);
  myobj = req.body;
  global.conn.collection('crash').deleteOne({ _id: idCrash }, myobj, function (err, result) {
    if (err) return console.log(err);
    //Check item
    redisClient.get(urlId, function (err, result) {
      if (err) { return console.log(err) };
      if (result) {
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



// Config Resify
const port = 8007;
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Start Serve
server.listen(port, function () {
  console.log('%s listening at %s', server.name, server.url);
})