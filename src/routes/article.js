const express = require('express');

const router = express.Router();

// Example: Establishing a connection and query to db
const pool = require('../util/connect');

// Process an article with specific storage-room id
router.post('/process', (req, res) => {
  const processArticle = {
    material_number: req.body.material_number,
    comment: req.body.comment,
    storage_room: req.body.storage_room,
  };
  if (!processArticle.material_number || !processArticle.storage_room) {
    res.status(400).send('Bad request');
  } else {
    // eslint-disable-next-line consistent-return



    let sql1 = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, branch, article)';

    sql1 += ' SELECT "processed", 55555, 1, ?,';
    
    sql1 += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?)))';
    
    sql1 += " THEN (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?))) ELSE ' - ' END as package,";
    
    sql1 += ' Shelf.shelf_name, StorageRoom.name as "storageroom", Branch.name, Article.id FROM Shelf, StorageRoom, Branch, Article WHERE';
    
    sql1 += ' (Shelf.id = (select container from StorageMap where article = (select id from Article where material_number = ?)) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = (select id from Article where material_number = ?)))) AND';

    sql1 += ' StorageRoom.id = ? AND';

    sql1 += ' Branch.id = (select branch from StorageRoom where id=?) AND';

    sql1 += ' Article.material_number = ?';

    let sql2 = 'delete from StorageMap where article = (select id from Article where material_number = ?)';

    let sql3 = 'select * from StorageEvent order by id desc limit 1';

    sql3 = "select material_number from Article where id in (select article from StorageMap)";

    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Could not connect to server');
      }
      connection.query(sql1, [processArticle.comment, processArticle.material_number, processArticle.material_number, processArticle.material_number, processArticle.material_number, processArticle.storage_room, processArticle.storage_room, processArticle.material_number], (err1, result1) => {
        connection.release();
        if (err1) {
          console.log(err1);
          return res.status(400).send('Bad query1');
        }
        console.log(sql1);
      });
    });



    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Could not connect to server');
      }
      connection.query(sql2, [processArticle.material_number], (err, result) => {
        connection.release();
        if (err) {
          console.log(err);
          return res.status(400).send('Bad query2');
        }
      });
    });




    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Could not connect to server');
      }
      connection.query(sql3, (err, result3) => {
        connection.release();
        if (err) {
          console.log(err);
          return res.status(400).send('Bad query3');
        }
       res.send(result3);
      });
    });


  }
});

// Checks out article
router.post('/check-out', (request, response) => {
  const checkOut = {
    material_number: request.body.material_number,
    comment: request.body.comment,
    storage_room: request.body.storage_room,
  };
  if (!checkOut.storage_room || !checkOut.material_number) {
    response.status(400).send('Bad request');
  } else {
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(err);
        response.status(500).send('Could not connect to server');
      } else {
        connection.beginTransaction(function (err0) {
          if (err0) {
            console.log(err0);
            response.status(500).send('Could not start transaction');
          } else {

            // Gets storageroom to compare with given storageroom from user
            let sql = 'SELECT current_storage_room FROM Container WHERE id = (SELECT container FROM StorageMap WHERE article = (SELECT id from Article WHERE material_number = ?)) ';
            connection.query(sql, [checkOut.material_number], function (err2, result1) {
              if (err2) {
                connection.rollback(function () {
                  console.log(err2);
                  response.status(400).send('Article is not stored in this storage room!');
                });
              } else if (result1[0].current_storage_room == checkOut.storage_room) {
                // Selects article that is getting checked out
                sql = 'SELECT article FROM StorageMap WHERE article = (SELECT id FROM Article WHERE material_number = ?)';

                connection.query(
                  sql,
                  [
                    checkOut.material_number,
                  ],
                  function (err3, result2) {
                    if (err3) {
                      connection.rollback(function () {
                        console.log(err3);
                        response.status(400).send('Bad query');
                      });
                    } else {
                      // Creates Storage event for the article
                      for (a in result2) {
                        // User is hardcoded to "1" right now
                        sql = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, article, branch) VALUES ("checked_out", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?, "lab", "345", (SELECT name FROM StorageRoom WHERE id = ?),?,(SELECT name FROM Branch WHERE id = (SELECT branch FROM StorageRoom WHERE id = ?)))';

                        connection.query(
                          sql,
                          [
                            checkOut.comment,
                            checkOut.storage_room,
                            result2[a].article,
                            checkOut.storage_room,
                          ],
                          function (err4, result3) {
                            if (err4) {
                              connection.rollback(function () {
                                console.log(err3);
                                response.status(400).send('Bad query');
                              });
                            } else {
                              console.log(result2[a].article + " created");

                              sql = 'SELECT * FROM StorageEvent WHERE id = ?';
                              connection.query(
                                sql,
                                [
                                  result3.insertID,
                                ],
                                function (err5, result4) {
                                  if (err5) {
                                    connection.rollback(function () {
                                      console.log(err5);
                                      response.status(400).send('Bad query');
                                    });
                                  }
                                  console.log(result3.insertID);
                                  response.send(result4);
                                });

                            
                            }
                            //response.send(result3.insertId);

                          },
                        );
                      }
                      connection.commit(function (err5) {
                        if (err5) {
                          connection.rollback(function () {
                            console.log(err5);
                          });
                        } else {
                          console.log('Transaction Complete.');
                          connection.end();
                        }
                      });
                      //response.json({ resultat: "Ok" });
                    }
                    


                  });

              } else {
                response.status(400).send('Bad query');
              }
            });
          }
        });
      }
    });
  }
});

module.exports = router;
