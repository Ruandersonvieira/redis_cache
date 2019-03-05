const MongoClient = require('mongodb').MongoClient;

MongoClient.connect("mongodb+srv://ruanderson_vieira:sillas123@huggyteste-c5ptp.mongodb.net/test?retryWrites=true",{ useNewUrlParser: true })
            .then(conn => global.conn = conn.db("huggyteste"))
            .catch(err => console.log(err))
 
module.exports = { 

    
}

