const express = require('express');
const router = express.Router();
const pool = require('../../connect');

// returns all storage events
router.get('/', (request, response) => {

    pool.getConnection(function(err, connection) {
        if (err){
          console.log(err);
          response.status(500).send('Cannot conect to server');
        }
        let sql_query = "select * from StorageEvent";
        connection.query(sql_query, (err, result) => {
          connection.release();
          if (err){
            console.log(err);
            response.status(500).send('Bad query');
          }
          console.log("Data received");
          response.send(result);
        });
      });
});






router.get('/article/:article_id', (request, response) => {
    let article_id = request.params.article_id;
    pool.getConnection(function(err, connection) {
        if (err){
          console.log(err);
          response.status(500).send('Cannot conect to server');
        }
        response.send("data-delivery article_id: " + article_id);
    });
});



router.get('/storageroom/:storageroom_id', (request, response) => {
    let storageroom_id = request.params.storageroom_id;
    pool.getConnection(function(err, connection) {
        if (err){
          console.log(err);
          response.status(500).send('Cannot conect to server');
        }
        response.send("data-delivery storageroom_id: " + storageroom_id);
    });
});


router.post('/create/', (request, response) => {

    const newStorageEvent = {
        name: request.body.name
    }

    pool.getConnection(function(err, connection) {
        if (err){
          console.log(err);
          response.status(500).send('Cannot conect to server');
        }
        response.send(newStorageEvent);
    });
});





module.exports = router;