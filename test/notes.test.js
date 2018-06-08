'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);



describe ('Notes Integration Testing', function(){
  this.timeout(5000);

  before(() => {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
          
  beforeEach(() => {
    return Note.insertMany(seedNotes);
  });
          
  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });
          
  after(() => {
    return mongoose.disconnect();
  });


  ///////////////////////////////   GET ALL   ///////////////////////////////

  describe('GET /api/notes', () => {

    it('should retrun all notes and return a list with the correct fields', () =>{
      let data;
      return Note.find()
        .then(_data => {
          data = _data;
          return chai.request(app).get('/api/notes');
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId');
          });
        });
    });
  
    it('should return correct search results for a searchTerm query', function () {
      const searchTerm = '3';
      const re = new RegExp(searchTerm, 'i');
      let data;

      return Note.find({$or: [{ 'title': re }, { 'content': re }]})
        .then((_data) => {
          data = _data;
          return chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          res.body.forEach(function (item, i) {
            expect(item).to.be.a('object');
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

  });

  ///////////////////////////////   GET BY ID   ///////////////////////////////

  describe('GET /api/notes/:id', () => {

    it('should get a note by id', () => {

      let data;

      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'folderId', 'content', 'createdAt', 'updatedAt');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should send status 400 and error message should be: `id` is not valid', () => {
      return chai.request(app)
        .get('/api/notes/NOTVALID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should send status 404 because the id does not exist', () => {
      return chai.request(app)
        .get('/api/notes/123456789012')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  
  });

  ///////////////////////////////   POST   ///////////////////////////////

  describe('POST /api/notes', () => {
  
    it('should create and return a new item when provided valid data', () => {
      const newItem = {
        'title': 'Note 1000',
        'content': 'Content 1000'
      };

      let res;
      
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
          return Note.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });

    it('should send status 400 and error message should be: Missing `title` in request body', () => {
      const newItem = {content: 'Content 1000'};
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });  
  
  });

  ///////////////////////////////   PUT   ///////////////////////////////

  describe('PUT /api/notes/:id', () => {

    it('should update a note by id', function() {
      let data;

      const newNote = {
        title: 'Note 1000',
        content: 'Content 1000'
      };
    
      return Note.findOne()
        .then(note =>{
          data = note;
          return chai.request(app).put(`/api/notes/${data.id}`).send(newNote); 
        })
        .then(res =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'folderId', 'title', 'content', 'createdAt', 'updatedAt');
          
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(newNote.title);
          expect(res.body.content).to.equal(newNote.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
        });
    });

    it('should send status 400 and error message should be: `id` is not valid', () => {
      const updateItem = {
        title: 'Note 1000',
        content: 'Content 1000'
      };
      return chai.request(app)
        .put('/api/notes/NOTVALID')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should send status 404 because the id does not exist', () => {
      
      const updateItem = {
        title: 'Note 1000',
        content: 'Content 1000'
      };
      return chai.request(app)
        .put('/api/notes/123456789012')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should send status 400 and error message should be: Missing `title` in request body', () => {
      const updateItem = {
        content: 'Content 1000'
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;

          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  ///////////////////////////////   DELETE   ///////////////////////////////

  describe('DELETE /api/notes', () => {
  
    it('should delete note by id', () => {
    
      let data;

      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/notes/${data.id}`); 
        })      
        .then((res) => {
          expect(res).to.have.status(204);
          return Note.findById(data.id);
        })
        .then(res => {
          expect(res).to.equal(null);
        });
    });
  });
});