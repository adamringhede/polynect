var assert = require('assert');
//var request = require('request');
var Models = require('../../../lib/Models');
var mongoose = require('mongoose');
var ObjectId = require('objectid');
var request = require('supertest');
var moment = require('moment');

Models.init()

var api = 'http://localhost:9999';

process.env.POLYNECT_API_PORT = 9999;
process.env.MOCK_SERVICES = true;

// Start API
require('../../../lib/API')


var devId1 = ObjectId();
var devId2 = ObjectId();
var gameId1 = ObjectId();
var gameId2 = ObjectId();
var clientId = ObjectId();
var adminId = ObjectId();
var specId1 = ObjectId();
var specId2 = ObjectId();
var specId3 = ObjectId();
var fixtures = {
  Account: {
    d1: {
      _id: devId1,
      role: 'developer',
      username: 'dev',
      password: 'pass'
    },
    d2: {
      _id: devId2,
      role: 'developer',
      username: 'dev2',
      password: 'pass'
    },
    admin: {
      _id: adminId,
      role: 'admin',
      username: 'dev',
      password: 'pass'
    }
  },

  Client: {
    c1: {
      _id: clientId,
      name: 'Test Client',
      client_id: 'client',
      secret: 'secret'
    }
  },
  AccessToken: {
    t1: {
      token: 'testtoken',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId1
    },
    d2: {
      token: 'testtoken3',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: devId2
    },
    admin: {
      token: 'testtoken2',
      expires: moment().add(1, 'hours'),
      client_id: 'client',
      holder: adminId
    }
  },
  Game: {
    g1: {
      _id: gameId1,
      name: 'Game',
      developer: devId1
    },
    g2: {
      _id: ObjectId(),
      name: 'Game',
      developer: ObjectId()
    },
    g3: {
      _id: gameId2,
      name: 'Game',
      developer: devId2
    }
  },
  ItemSpec: {
    spec1: {
      _id: specId1,
      name: 'Test spec',
      product_id: 'test_spec_one',
      game: gameId1,
      access_level: 1,
      attributes: {
        foo: 123
      }
    },
    spec2: {
      _id: specId2,
      name: 'Test spec',
      product_id: 'test_spec_two',
      game: gameId1,
      access_level: 1,
      stackable: true,
      attributes: {
        foo: 234
      }
    },
    spec3: {
      _id: specId3,
      name: 'Test spec',
      product_id: 'test_spec_three',
      game: gameId2,
      access_level: 0,
      stackable: true,
      attributes: {
        foo: 456
      }
    }
  }
}
describe('ItemSpecs API', function () {


  var f;
  beforeEach(function (done) {
    Models.load(fixtures, function (fixtures) {
      f = fixtures;
      done();
    });
  })

  describe('POST', function () {
    it('creates a new itemspec for a game', function (done) {
      request(api).post('/v1/itemSpecs')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          name: 'new item',
          game: gameId1
        })
        .expect(/new item/i, done);
    })
  });

  describe('GET', function () {
    it('lists item specs for a game', function (done) {
      request(api).get('/v1/itemSpecs')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(200, /"count":2/i, done);
    })
    it('fetches by id', function (done) {
      request(api).get('/v1/itemSpecs/' + specId1)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(200, /test_spec_one/i, done);
    })
  });

  describe('PUT', function () {
    it('changes existing specs', function (done) {
      request(api).put('/v1/itemSpecs/' + specId1)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          product_id: 'new_prod_id'
        })
        .expect(/new_prod_id/i, done);
    })
    it('can not change a spec that the developer does not have access to', function (done) {
      request(api).put('/v1/itemSpecs/' + specId3)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .send({
          product_id: 'new_prod_id'
        })
        .expect(403, done);
    })
  });

  describe('DELETE', function () {
    it('removes the spec', function (done) {
      request(api).delete('/v1/itemSpecs/' + specId1)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + fixtures.AccessToken.t1.token)
        .expect(200, /deleted/i, done);
    })
  })

});
