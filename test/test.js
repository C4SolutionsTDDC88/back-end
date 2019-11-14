<<<<<<< HEAD
/* const mocha = require('mocha');
const {expect, assert} = require('chai');
const filename = require('../test');
=======
/* eslint-disable global-require */
/* eslint-disable no-undef */
const { expect } = require('chai');
const request = require('supertest');
const pool = require('../src/util/connect');
>>>>>>> 39d7e02fd30b69f9ad5e4f8ba3637b97e28fc65c

let app;


before((done) => {
  app = require('../server');
  app.on('APP_STARTED', () => {
    done();
  });
});

describe('Test Database connection', () => {
  it('Application should login to database', (done) => {
    pool.getConnection((err, resp) => {
      expect(err).equal(null);
      done();
    });
  });
});

describe('Testing route cases', () => {
  it('Should return all cases (100 cases)', (done) => {
    request(app)
      .get('/case')
      .end((err, resp) => {
        const cases = resp.body.length;
        expect(err).to.equal(null);
        expect(cases).to.equal(100);
        done();
      });
  });


  it('Should return specific case (id: 5)', (done) => {
    request(app)
      .get('/case/5')
      .end((err, resp) => {
        const reqCase = resp.body;
        expect(err).to.equal(null);
        expect(reqCase.length).to.equal(1);
        expect(reqCase[0].id).to.equal(5);
        done();
      });
  });
});


// // post


describe('Test route branches', () => {
  it('Should return all branches(GET) (5 branches)', (done) => {
    request(app)
      .get('/branch')
      .end((err, resp) => {
        const branches = resp.body.length;
        expect(err).to.equal(null);
        expect(branches).to.equal(5);
        done();
      });
  }
  );

  // it('Should return specific branch (id: 3)', (done) => {
  //   request(app)
  //     .get('/branch/3')
  //     .end((err, resp) => {
  //       const reqBranch = resp.body;
  //       expect(err).to.equal(null);
  //       expect(reqBranch.length).to.equal(1);
  //       expect(reqBranch[0].id).to.equal(3);
  //       done();
  //     });
  // });
});

let p1;
let updated;
describe('Testing PUT funtionality on branch', () => {
  it('Should update the name of a branch (id:3)'), (done) => {
    p1 = new Promise(request(app)
      .put('/branch/3')
      .send({
        name: 'Test Branch',
      })
      .end((err, resp) => {
        expect(err).to.be.equal(null);
      }));
    p1.then(request(app)
      .get('/branch')
      .end((err, resp) => {
        const branches = resp.body;
        branches.forEach(name => {
          if (name === 'Test Branch') {
            updated = name;
          }
        });
        expect(updated).to.not.equal(undefined);
        expect(updated).to.be.equal('Test Branch');
      }));
  }
});

describe('Testing branch function post', () => {
  it('Should add a new branch', (done) => {
    request(app)
      .post('/branch')
      .send({
        name: 'Post Branch',
      })
      .end((err, resp) => {
        expect(err).to.equal(null);
      });
    request(app)
      .get('/branch/')
      .end((err, resp) => {
        const branchName = (resp.body.name === 'Post Branch');
        const branchNumb = resp.body.length;
        expect(branchName).to.not.equal(undefined);
        expect(barnchName).to.be.equal('Post Branch');
        expect(branchNumb).to.be.equal(6);
      });
  });
});


// describe('Testing branch function post', () => {
//   it('Should add a new branch', (done) => {
//     request(app)
//       .post('/branch/Testing facility')
//       .end((err, resp) => {
//         expect(err).to.equal(null);
//       });
//   });
// });
//   it('Should return specific branch (id: 3)', (done) => {
//         request(app)
//             .get('/branch/3')
//             .end((err, resp) => {
//                 const reqBranch = resp.body;
//                 expect(err).to.equal(null);
//                 expect(reqBranch.length).to.equal(1);
//                 expect(reqBranch[0].id).to.equal(3);
//                 done();
//             });
//     }); 
// });


// delete
// API - /storageroom Written Simon
describe('Testing storage room get', () => {
  it('Should return all storage room (6 rooms)', (done) => {
    request(app)
      .get('/storageroom/')
      .end((err, resp) => {
        const rooms = resp.body.length;
        expect(err).to.equal(null);
        expect(rooms).to.equal(6);
        done();
      });
  });
});


describe('Testing storage room post', () => {
  it('Making sure a room is added, testing post', (done) => {
    let p1 = new Promise(request(app)
      .post('/storageroom')
      .send({
        name: 'test room',
      })
      .end((err, resp) => {
        expect(err).to.equal(null);
      }));

    p1.then(request(app).get('/storageroom/7')
      .end((err, resp) => {
        const testroom = resp.body.name;
        expect(testroom).to.equal('test room');
        done();
      }));
  });
});


describe('Testing storage room put', () => {
  it('should update specified storageroom', (done) => {
    let p1 = new Promise(request(app)
      .put('/storageroom/1')
      .send({
        name: 'Testing room',
        branch: 1
      })
      .end((err, resp) => {
        expect(err).to.equal(null);
      }));
    p1.then(request(app).get('/storageroom/')
      .end((err, resp) => {
        const testingroom = resp.body(el) => el(id) === 1;
        expect(testingroom).to.equal('Testing room')
        done();
      }));
    p1.then(request(app).get('/storageroom/1')
      .end((err, resp) => {
        const testingroom = resp.body.name;
        expect(testingroom).to.equal('Testing room')
        done();
      }));
  });
});


describe('Testing storage room delete', () => {
  it('Should test removing a storage room', (done) => {
    let p1 = new Promise(request(app)
      .delete('/storageroom/1')
      .end((err, resp) => {
        expect(err).to.equal(null);
      }));
    p1.then(request(app).get('/storageroom/branch/3')
      .end((err, resp) => {
        const rooms = resp.body.length;
        expect(err).to.equal(null);
        expect(rooms).to.equal(1);
        done();
      }));
      .delete ('/storageroom/')
      .send({
        name: 'Vapen materialrum 1'
      })
      .end((err, resp) => {
        expect(err).to.equal(null);
      }));
  p1.then(request(app).get('/storageroom/1')
    .end((err, resp) => {
      expect(err).to.not.equal(null);
      done();
    }));
});
});


<<<<<<< HEAD
 */
// Require the built in 'assertion' library
let convert = require('../app.js');
let assert = require('assert');
// Create a group of tests about Arrays
describe('temperature conversion', function() {
  // Within our Array group, Create a group of tests for indexOf
  describe('cToF', function() {
    // A string explanation of what we're testing
    it('should convert -40 celsius to -40 fahrenheit', function() {
        assert.equal(-40, convert.cToF(-40));
     });
     it('should return undefined if no temperature is input', function(){
        assert.equal(undefined, convert.cToF(''));
      });
      it('should convert 0 celsius to 32 fahrenheit', function() {
        assert.equal(32, convert.cToF(0));




  });
});
  describe('fToC',function(){
        
    it('should convert -40 fahrenheit to -40 celsius', function() {
        assert.equal(-40, convert.fToC(-40));
      });
      it('should convert 32 fahrenheit to 0 celsius', function() {
        assert.equal(0, convert.fToC(32));
      });
      it('should return undefined if no temperature is input', function(){
        assert.equal(undefined, convert.fToC(''));
      });

     
=======
describe('Testing storage room branch', () => {
  it('Should test to printing every storage room on a branch', (done) => {
    request(app)
      .get('/storageroom/branch/1')
      .end((err, resp) => {
        const rooms = resp.body.length;
        expect(err).to.equal(null)
        expect(rooms).to.equal(2);
        done();
      });
>>>>>>> 39d7e02fd30b69f9ad5e4f8ba3637b97e28fc65c
  });
});