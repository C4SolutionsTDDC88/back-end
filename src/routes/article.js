const express = require('express');
const router = express.Router();

//Example: Establishing a connection and query to db
const pool = require('../../connect');

  // Register new article
  router.post('/', (req, res) => {
    const newArticle = { 
      material_number: req.body.material_number,
      description: req.body.description,
      parent: req.body.parent,
      case: req.body.case
    }
    if(!newArticle.material_number || !newArticle.description || !newArticle.case || !newArticle.parent){
      res.status(400).send('Bad request');
    } else {
        pool.getConnection(function(err, connection) {
          if (err) {
            console.log(err);
            res.status(500).send('Could not connect to server');
          }
          let sql = 'INSERT INTO Article(material_number, description, parent, case) VALUES (?, ?, ?, ?)';
          connection.query(sql, [newArticle.material_number, newArticle.description, newArticle.parent, newArticle.case], function (err, result) {
            connection.release();
            if (err) {
              console.log(err);
              res.status(400).send('Bad query');
            } else {
            console.log('New article added');
           res.send(result);
            }
          });
        })
      }
    });
  
 

  //Return all articles in DB
  router.get('/', (req, res) => {
    pool.getConnection(function(err, connection) {
      if (err) console.log(err);
      connection.query('SELECT * FROM Article', (err,result) => {
        connection.release();
        if (err) throw err;
        console.log(res);
        res.send(result)
    });
  });
});

  //Return single article
  router.get('/:id', (req, res) => {
     let id = req.params.id;
    pool.getConnection(function(err, connection) {
      if (err) console.log(err);
      connection.query('SELECT * FROM Article WHERE id = ?', [id], (err,result) => {
        connection.release();
        if (err) throw err;
        console.log(res);
        res.send(result)
    });
  });
});

  module.exports = router;
