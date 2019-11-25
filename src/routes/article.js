const express = require('express');
const router = express.Router();
const pool = require('../util/connect');

/* eslint-disable no-const-assign */
/* eslint-disable camelcase */
/* eslint-disable no-shadow */


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
    let sql1 = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, branch, article)';
    sql1 += 'SELECT "processed", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?,';
    sql1 += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?)))';
    sql1 += " THEN (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?))) ELSE NULL END as package,";
    sql1 += ' Shelf.shelf_name, StorageRoom.name as "storageroom", Branch.name, Article.id FROM Shelf, StorageRoom, Branch, Article WHERE';
    sql1 += ' (Shelf.id = (select container from StorageMap where article = (select id from Article where material_number = ?)) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = (select id from Article where material_number = ?)))) AND';
    sql1 += ' StorageRoom.id = ? AND';
    sql1 += ' Branch.id = (select branch from StorageRoom where id=?) AND';
    sql1 += ' Article.material_number = ?';

    let array1 = [
      processArticle.comment,
      processArticle.material_number,
      processArticle.material_number,
      processArticle.material_number,
      processArticle.material_number,
      processArticle.storage_room,
      processArticle.storage_room,
      processArticle.material_number];


    let sql2 = 'delete from StorageMap where article = (select id from Article where material_number = ?)';

    let array2 = [processArticle.material_number];


    let sql3 = 'select * from StorageEvent order by id desc limit 1';
    //sql3 = "select material_number from Article where id in (select article from StorageMap)";

    pool.getConnection((err0, connection) => {
      if (err0) {
        console.log(err0);
        return res.status(500).send('Could not connect to server');
      }
      else {
        connection.beginTransaction(function (err1) {
          if (err1) {
            console.log(err1);
            res.status(500).send('Could not start transaction');
          }
          else {
            connection.query(sql1, array1, function (err2, result2) { // inserts data into StorageEvent
              if (err2) {
                connection.rollback(function () {
                  console.log(err2);
                  res.status(400).send('Bad query');
                });
              }
              else {
                if (result2.affectedRows == 1) { // checks whether 1 entry was inserted in storageevent, ie, if the material number exists.

                  connection.query(sql2, array2, function (err4, result4) { //deletes entry in storagemap
                    if (err4) {
                      connection.rollback(function () {
                        console.log(err4);
                        res.status(400).send('Bad query');
                      });
                    }
                    else {
                      connection.query(sql3, function (err5, result5) { // displays storageevent entry with highest id
                        if (err5) {
                          connection.rollback(function () {
                            console.log(err5);
                            res.status(400).send('Bad query');
                          });
                        }
                        else {
                          connection.commit(function (err9) {
                            if (err9) {
                              connection.rollback(function () {
                                console.log(err9);
                              });
                            }
                            else {
                              res.send(result5);
                              console.log('Transaction Complete.');
                            }
                          });
                        }
                      });
                    }
                  });
                }
                else {
                  res.status(400).send('Material number does not exist.');
                }
              }
            });
          }
        });
        connection.release();
      }
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
            sql = 'SELECT current_storage_room FROM Container WHERE id = (SELECT container FROM StorageMap WHERE article = (SELECT id from Article WHERE material_number = ?)) ';
            connection.query(sql, [checkOut.material_number], function (err2, result1) {
              if (err2 || !result1[0] || !result1[0].current_storage_room) {
                connection.rollback(function () {
                  console.log(err2);
                  response.status(400).send('Bad query! Your article may have already been checked out.');
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
                      
                        // User is hardcoded to "1" right now
                        //sql = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, article, branch) VALUES ("checked_out", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?, " - ", " - ", (SELECT name FROM StorageRoom WHERE id = ?),?,(SELECT name FROM Branch WHERE id = (SELECT branch FROM StorageRoom WHERE id = ?)))';

                        //sql = 'SELECT * FROM StorageEvent'


                        sql = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, branch, article)';
                        sql += 'SELECT "checked_out", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?,';
                        sql += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?)))';
                        sql += " THEN (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?))) ELSE NULL END as package,";
                        sql += ' Shelf.shelf_name, StorageRoom.name as "storageroom", Branch.name, Article.id FROM Shelf, StorageRoom, Branch, Article WHERE';
                        sql += ' (Shelf.id = (select container from StorageMap where article = (select id from Article where material_number = ?)) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = (select id from Article where material_number = ?)))) AND';
                        sql += ' StorageRoom.id = ? AND';
                        sql += ' Branch.id = (select branch from StorageRoom where id=?) AND';
                        sql += ' Article.material_number = ?';




                        connection.query(
                          sql,
                          [
                            checkOut.comment,
                            checkOut.material_number,
                            checkOut.material_number,
                            checkOut.material_number,
                            checkOut.material_number,
                            checkOut.storage_room,
                            checkOut.storage_room,
                            checkOut.material_number,
                          ],
                          function (err4, result3) {
                            if (err4) {
                              connection.rollback(function () {
                                console.log(err4);
                                response.status(400).send('Bad query');
                              });
                            } else {
                              console.log(result3);

                              sql = 'SELECT * FROM StorageEvent WHERE id = ?';
                              connection.query(
                                sql,
                                [
                                  result3.insertId,
                                ],
                                function (err5, result4) {
                                  if (err5) {
                                    connection.rollback(function () {
                                      console.log(err5);
                                      response.status(400).send('Bad query');
                                    });
                                  }
                                  response.send(result4);
                                });

                              sql = 'DELETE from StorageMap where article = (select id from Article where material_number = ?)';
                              connection.query(
                                sql,
                                [
                                  checkOut.material_number,
                                ],
                                function (err6, result5) {
                                  if (err6) {
                                    connection.rollback(function () {
                                      console.log(err6);
                                      response.status(400).send('Bad query');
                                    });
                                  } else {
                                    console.log(result5);
                                  }
                                })
                            }
                          },
                        );
                      
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

// Discards an article
router.post('/discard', (request, response) => {
  const discard = {
    material_number: request.body.material_number,
    comment: request.body.comment,
    storage_room: request.body.storage_room,
  };
  if (!discard.storage_room || !discard.material_number) {
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
            sql = 'SELECT current_storage_room FROM Container WHERE id = (SELECT container FROM StorageMap WHERE article = (SELECT id from Article WHERE material_number = ?)) ';
            connection.query(sql, [discard.material_number], function (err2, result1) {
              if (err2 || !result1[0] || !result1[0].current_storage_room) {
                connection.rollback(function () {
                  console.log(err2);
                  response.status(400).send('Bad query! Your article may have already been discarded.');
                });
              } else if (result1[0].current_storage_room == discard.storage_room) {
                // Selects article that is getting checked out
                sql = 'SELECT article FROM StorageMap WHERE article = (SELECT id FROM Article WHERE material_number = ?)';

                connection.query(
                  sql,
                  [
                    discard.material_number,
                  ],
                  function (err3, result2) {
                    if (err3) {
                      connection.rollback(function () {
                        console.log(err3);
                        response.status(400).send('Bad query');
                      });
                    } else {
                      // Creates Storage event for the article
                        // User is hardcoded to "1" right now
                        //sql = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, article, branch) VALUES ("checked_out", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?, " - ", " - ", (SELECT name FROM StorageRoom WHERE id = ?),?,(SELECT name FROM Branch WHERE id = (SELECT branch FROM StorageRoom WHERE id = ?)))';

                        //sql = 'SELECT * FROM StorageEvent'


                        sql = 'INSERT INTO StorageEvent (action, timestamp, user, comment, package, shelf, storage_room, branch, article)';
                        sql += 'SELECT "discarded", (SELECT DATE_FORMAT(NOW(), "%y%m%d%H%i")), 1, ?,';
                        sql += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?)))';
                        sql += " THEN (select package_number from Package where id  = (select container from StorageMap where article = (select id from Article where material_number = ?))) ELSE NULL END as package,";
                        sql += ' Shelf.shelf_name, StorageRoom.name as "storageroom", Branch.name, Article.id FROM Shelf, StorageRoom, Branch, Article WHERE';
                        sql += ' (Shelf.id = (select container from StorageMap where article = (select id from Article where material_number = ?)) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = (select id from Article where material_number = ?)))) AND';
                        sql += ' StorageRoom.id = ? AND';
                        sql += ' Branch.id = (select branch from StorageRoom where id=?) AND';
                        sql += ' Article.material_number = ?';




                        connection.query(
                          sql,
                          [
                            discard.comment,
                            discard.material_number,
                            discard.material_number,
                            discard.material_number,
                            discard.material_number,
                            discard.storage_room,
                            discard.storage_room,
                            discard.material_number,
                          ],
                          function (err4, result3) {
                            if (err4) {
                              connection.rollback(function () {
                                console.log(err4);
                                response.status(400).send('Bad query');
                              });
                            } else {
                              console.log(result3);

                              sql = 'SELECT * FROM StorageEvent WHERE id = ?';
                              connection.query(
                                sql,
                                [
                                  result3.insertId,
                                ],
                                function (err5, result4) {
                                  if (err5) {
                                    connection.rollback(function () {
                                      console.log(err5);
                                      response.status(400).send('Bad query');
                                    });
                                  }
                                  response.send(result4);
                                });

                              sql = 'DELETE from StorageMap where article = (select id from Article where material_number = ?)';
                              connection.query(
                                sql,
                                [
                                  discard.material_number,
                                ],
                                function (err6, result5) {
                                  if (err6) {
                                    connection.rollback(function () {
                                      console.log(err6);
                                      response.status(400).send('Bad query');
                                    });
                                  } else {
                                    console.log(result5);
                                  }
                                })
                            }
                          },
                        );
                      
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


// Register new article
router.post('/', (req, res) => {
  const newArticle = {
    material_number: req.body.material_number,
    description: req.body.description,
    case: req.body.case,
  };
  if (
    !newArticle.material_number
    || !newArticle.description
    || !newArticle.case
  ) {
    res.status(400).send('Bad request');
  } else {
    // eslint-disable-next-line consistent-return
    pool.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Could not connect to server');
      }
      const sql = 'INSERT INTO Article(material_number, description, `case`) VALUES (?, ?, ?)';
      const article = [
        newArticle.material_number,
        newArticle.description,
        newArticle.case,
      ];
      console.log(sql);
      console.log(article);
      // eslint-disable-next-line consistent-return
      connection.query(sql, article, (err, result) => {
        connection.release();
        if (err) {
          console.log(err);
          return res.status(400).send('Bad query');
        }
        console.log('New article added');
        res.send(result);
      });
    });
  }
});

// Return all articles in DB
router.get('/', (req, res) => {
  // eslint-disable-next-line func-names
  pool.getConnection((err, connection) => {
    let sql_query = "select Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
    sql_query
      += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = Article.id))';
    sql_query
      += " THEN (select package_number from Package where id  = (select container from StorageMap where article = Article.id)) ELSE ' - ' END as package,";
    sql_query
      += " Shelf.shelf_name as 'shelf', se2.action as 'status',se1.timestamp as 'timestamp', se2.timestamp as 'last modified', Article.description";
    sql_query
      += ' FROM Article, `Case`, Branch, StorageRoom, Shelf, StorageEvent as se1, StorageEvent as se2';
    sql_query += ' WHERE Article.case = Case.id';
    sql_query
      += ' and (StorageRoom.id = (select current_storage_room from Container where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' and (Shelf.id = (select container from StorageMap where article = Article.id) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' AND se1.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp ASC LIMIT 1)';
    sql_query
      += ' AND se2.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp DESC LIMIT 1)';
    sql_query += ' and Branch.id = StorageRoom.branch';
    sql_query += ' ORDER BY Article.material_number asc';

    if (err) console.log(err);
    connection.query(sql_query, (err, result) => {
      connection.release();
      if (err) throw err;
      console.log(res);
      res.send(result);
    });
  });
});

// Return single article
router.get('/:id', (req, res) => {
  const { id } = req.params;
  pool.getConnection((err, connection) => {
    if (err) console.log(err);

    let sql_query = "select Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
    sql_query
      += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = Article.id))';
    sql_query
      += " THEN (select package_number from Package where id  = (select container from StorageMap where article = Article.id)) ELSE ' - ' END as package,";
    sql_query
      += " Shelf.shelf_name as 'shelf', se2.action as 'status',se1.timestamp as 'timestamp', se2.timestamp as 'last modified', Article.description";
    sql_query
      += ' FROM Article, `Case`, Branch,  StorageRoom, Shelf, StorageEvent as se1, StorageEvent as se2';
    sql_query += ' WHERE Article.case = Case.id';
    sql_query
      += ' and (StorageRoom.id = (select current_storage_room from Container where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' and (Shelf.id = (select container from StorageMap where article = Article.id) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' AND se1.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp ASC LIMIT 1)';
    sql_query
      += ' AND se2.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp DESC LIMIT 1)';
    sql_query += ' AND Article.id = ?';
    sql_query += ' and Branch.id = StorageRoom.branch';
    sql_query += ' ORDER BY Article.material_number asc';

    connection.query(sql_query, [id], (err, result) => {
      connection.release();
      if (err) throw err;
      console.log(res);
      console.log(sql_query);
      res.send(result);
    });
  });
});

// Return all articles for a specific case
router.get('/case/:id', (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line consistent-return
  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Could not connect to server');
    }
    let sql_query = "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
    sql_query
      += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = Article.id))';
    sql_query
      += " THEN (select package_number from Package where id  = (select container from StorageMap where article = Article.id)) ELSE ' - ' END as package,";
    sql_query
      += " Shelf.shelf_name as 'shelf', se2.action as 'status',se1.timestamp as 'timestamp', se2.timestamp as 'last modified', Article.description";
    sql_query
      += ' FROM Article, `Case`, Branch, StorageRoom, Shelf, Package, Container, StorageEvent as se1, StorageEvent as se2';
    sql_query += ' WHERE Article.case = Case.id';
    sql_query
      += ' and (StorageRoom.id = (select current_storage_room from Container where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' and (Shelf.id = (select container from StorageMap where article = Article.id) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' AND se1.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp ASC LIMIT 1)';
    sql_query
      += ' AND se2.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp DESC LIMIT 1)';
    sql_query += ' and Branch.id = StorageRoom.branch';
    sql_query += ' and Case.id = ?';
    sql_query += ' ORDER BY Article.material_number asc';

    if (err) console.log(err);
    connection.query(sql_query, [id], (err, result) => {
      connection.release();
      if (err) throw err;
      console.log(res);
      console.log(sql_query);
      res.send(result);
    });
  });
});

// Return all articles currently in a specific storage room
router.get('/storageroom/:id', (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line func-names
  // eslint-disable-next-line consistent-return
  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Could not connect to server');
    }
    let sql_query = "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
    sql_query
      += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = Article.id))';
    sql_query
      += " THEN (select package_number from Package where id  = (select container from StorageMap where article = Article.id)) ELSE ' - ' END as package,";
    sql_query
      += " Shelf.shelf_name as 'shelf', se2.action as 'status',se1.timestamp as 'timestamp', se2.timestamp as 'last modified', Article.description";
    sql_query
      += ' FROM Article, `Case`, Branch, StorageRoom, Shelf, Package, Container, StorageEvent as se1, StorageEvent as se2';
    sql_query += ' WHERE Article.case = Case.id';
    sql_query += ' and StorageRoom.id = ?';
    sql_query
      += ' and (StorageRoom.id = (select current_storage_room from Container where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' and (Shelf.id = (select container from StorageMap where article = Article.id) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' AND se1.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp ASC LIMIT 1)';
    sql_query
      += ' AND se2.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp DESC LIMIT 1)';
    sql_query += ' and Branch.id = StorageRoom.branch';
    sql_query += ' ORDER BY Article.material_number asc';

    if (err) console.log(err);
    connection.query(sql_query, [id], (err, result) => {
      connection.release();
      if (err) throw err;
      console.log(res);
      console.log(sql_query);
      res.send(result);
    });
  });
});

// Return all articles in a specific package
router.get('/package/:id', (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line func-names
  // eslint-disable-next-line consistent-return
  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Could not connect to server');
    }
    let sql_query = "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
    sql_query
      += ' CASE WHEN EXISTS (select package_number from Package where id  = (select container from StorageMap where article = Article.id))';
    sql_query
      += " THEN (select package_number from Package where id  = (select container from StorageMap where article = Article.id)) ELSE ' - ' END as package,";
    sql_query
      += " Shelf.shelf_name as 'shelf', se2.action as 'status',se1.timestamp as 'timestamp', se2.timestamp as 'last modified', Article.description";
    sql_query
      += ' FROM Article, `Case`, Branch, StorageRoom, Shelf, Package, Container, StorageEvent as se1, StorageEvent as se2';
    sql_query += ' WHERE Article.case = Case.id';
    sql_query
      += ' and (StorageRoom.id = (select current_storage_room from Container where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' and (Shelf.id = (select container from StorageMap where article = Article.id) OR Shelf.id = (select shelf from Package where id = (select container from StorageMap where article = Article.id)))';
    sql_query
      += ' AND se1.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp ASC LIMIT 1)';
    sql_query
      += ' AND se2.id = (SELECT id from StorageEvent WHERE article = Article.id ORDER BY timestamp DESC LIMIT 1)';
    sql_query += ' and Branch.id = StorageRoom.branch';
    sql_query += ' and Package.id = ?';
    sql_query
      += ' AND Package.id = (select id from Container where Container.id = (select container from StorageMap where article = Article.id))';
    sql_query += ' ORDER BY Article.material_number asc';

    if (err) console.log(err);
    connection.query(sql_query, [id], (err, result) => {
      connection.release();
      if (err) throw err;
      console.log(res);
      console.log(sql_query);
      res.send(result);
    });
  });
});

// gets all articles belonging to a specific branch
router.get('/branch/:branch_id', (request, response) => {
  const branchid = request.params.branch_id;
  pool.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      response.status(500).send('Could not connect to server');
    } else {
      const sql = 'SELECT * FROM Article  WHERE id IN (SELECT article FROM StorageMap WHERE container IN (SELECT id FROM Container WHERE current_storage_room IN (SELECT id FROM StorageRoom WHERE branch = ?)))';
      connection.query(sql, [branchid], (err, result) => {
        connection.release();
        if (err) {
          console.log(err);
          response.status(400).send('Bad query');
        } else {
          console.log('Data received');
          response.send(result);
        }
      });
    }
  });
});

module.exports = router;
