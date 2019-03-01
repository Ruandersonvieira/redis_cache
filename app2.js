const redis = require('redis');
const jsonify = require('redis-jsonify');

var redisClient = jsonify(redis.createClient({host : 'redis-16564.c73.us-east-1-2.ec2.cloud.redislabs.com', port : 16564}));

redisClient.auth('XUBIIoEhmZiHwhwq81LIbn3C6Tw0hzo8',function(err,reply) {

});

redisClient.on('ready',function() {
  console.log("Redis is ready");
 });
 
 redisClient.on('error',function() {
  console.log("Error in Redis");
 });

 redisClient.del('asdf', function (err, result) {
     console.log(result)
 })
/*

 redisClient.set('asdf', { foo : "bar" }, function (err, result){});*/
    redisClient.get('asdf', function (err, result) {
        if(err){
            return console.log(err);
        }

        console.log(result);

        if(result){
            console.log("achou");
        } else {
            console.log("nao");
        }

        //console.log(result); 
        // should be { foo : "bar" } and not [Object object]
        
        redisClient.quit(function () {	});
    });
//});
