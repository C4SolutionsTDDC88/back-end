/* eslint-disable no-const-assign */
/* eslint-disable camelcase */
/* eslint-disable no-shadow */
const express = require('express');

const router = express.Router();

// Example: Establishing a connection and query to db
const pool = require('../util/connect');

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
      const sql =        'INSERT INTO Article(material_number, description, `case`) VALUES (?, ?, ?)';
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
    let sql_query =      "select Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
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

    let sql_query =      "select Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
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
    let sql_query =      "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
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
    let sql_query =      "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
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
    let sql_query =      "select distinct Article.material_number, Case.reference_number, Branch.name as 'branch', StorageRoom.name as 'storage_room',";
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
      const sql =        'SELECT * FROM Article  WHERE id IN (SELECT article FROM StorageMap WHERE container IN (SELECT id FROM Container WHERE current_storage_room IN (SELECT id FROM StorageRoom WHERE branch = ?)))';
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
