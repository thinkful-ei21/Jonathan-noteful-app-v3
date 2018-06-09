'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);


describe('Noteful API - Tags Integration Testing', function () {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Tag.insertMany(seedTags)
      .then(() => Tag.createIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  ///////////////////////////////   GET ALL   ///////////////////////////////

  describe('GET /api/tags', function () {

    it('should retrun all tags and return a list with the correct fields and values', () => {
      let data;
      return Tag.find().sort('name')
        .then(_data => {
          data = _data;
          return chai.request(app).get('/api/tags');
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.name).to.equal(data[i].name);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

  });

  ///////////////////////////////   GET BY ID   ///////////////////////////////

  describe('GET /api/tags/:id', () => {

    it('should return a tag by id', () => {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should send status 400 and error message should be: `id` is not valid', () => {
      return chai.request(app)
        .get('/api/tags/NOTVALID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should send status 404 because the id does not exist', () => {
      return chai.request(app)
        .get('/api/tags/123456789012')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  ///////////////////////////////   POST   ///////////////////////////////

  describe('POST /api/tags', () => {

    it('should create and return a new item when provided valid data', () => {
      const newItem = { name: 'newTag' };
      let body;
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          return Tag.findById(body.id);
        })
        .then(data => {
          expect(body.id).to.equal(data.id);
          expect(body.name).to.equal(data.name);
          expect(new Date(body.createdAt)).to.eql(data.createdAt);
          expect(new Date(body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should send status 400 and error message should be: Missing `name` in request body', () => {
      const newItem = { invalid: 'Tag 1000' };
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', () => {
      return Tag.findOne()
        .then(data => chai.request(app).post('/api/tags').send({ name: data.name }))
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Tag name already exists');
        });
    });

  });

  ///////////////////////////////   PUT   ///////////////////////////////
  
  describe('PUT /api/tags/:id', () => {

    it('should update a tag by id', () => {
      const updateItem = { name: 'Tag 1000' };
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/tags/${data.id}`).send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateItem.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });


    it('should send status 400 and error message should be: `id` is not valid', () => {    
      const updateItem = { name: 'Tag 1000' };
      return chai.request(app)
        .put('/api/tags/NOTVALID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should send status 404 because the id does not exist', () => {
      const updateItem = { name: 'Tag 1000' };
      return chai.request(app)
        .put('/api/tags/123456789012')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should send status 400 and error message should be: Missing `name` in request body', () => {
      const updateItem = {};
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/tags/${data.id}`).send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', () => {
      return Tag.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app).put(`/api/tags/${item1.id}`).send(item1);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Tag name already exists');
        });
    });

  });

  ///////////////////////////////   DELETE   ///////////////////////////////
  
  describe('DELETE /api/tags/:id', () => {

    it('should delete tag by id', () => {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Tag.count({ _id: data.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should send status 400 and error message should be: `id` is not valid', () => {
      return chai.request(app)
        .delete('/api/tags/NOTVALID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

  });

});
