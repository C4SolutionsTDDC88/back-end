const express = require('express');
const router = express.Router();
const pool = require('../../connect');

//gets all cases
router.get('/', (request, response)=>{
    pool.getConnection(function(err, connection) {
        if (err){
          console.log(err);
          response.status(500).send('Cannot conect to server');
        }
        let sql = 'SELECT * FROM `Case`';
        connection.query(sql, (err, result) => {
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
//gets case of a specific ID
router.get('/:id', (request, response)=>{
    let id = request.params.id;
    pool.getConnection(function(err, connection) {
        if (err){
           console.log(err);
           response.status(500).send('Cannot conect to server');
          }
        let sql = 'SELECT * FROM `Case` WHERE ID = ?';
        connection.query(sql, [id], (err, result) => {
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

module.exports = router;