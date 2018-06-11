'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);



describe ('Noteful API - Notes Integration Testing', function(){

  before(() => {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
          
  beforeEach(() => {
    return Note.insertMany(seedNotes)
      .then(() => Folder.insertMany(seedFolders))
      .then(() => Folder.createIndexes())
      .then(() => Tag.insertMany(seedTags))
      .then(() => Tag.createIndexes());
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
            expect(item).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'folderId', 'tags');
          });
        });
    });
  
    it('should return correct search results for a searchTerm query', () => {
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
            expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt', 'tags');
            expect(item.id).to.equal(data[i].id);
            expect(item.title).to.equal(data[i].title);
            expect(item.content).to.equal(data[i].content);
            expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
            expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
          });
        });
    });

    it('should return correct search results for a folderId query', () => {
      let folder;
      let folderList;
      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          return Note.find({ folderId: folder.id });
        })
        .then(_folderList => {
          folderList = _folderList;
          return chai.request(app).get(`/api/notes?folderId=${folder.id}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(folderList.length);
        });
    });

    it('should return correct search results for a tags query', () => {
      let tag;
      let tagList;
      return Tag.findOne()
        .then(_tag => {
          tag = _tag;
          return Note.find({ tags: tag.id });
        })
        .then(_tagList => {
          // console.log(_tagList);
          tagList = _tagList;
          // console.log(tagList);
          // console.log(tag.id);
          return chai.request(app).get(`/api/notes?tagId=${tag.id}`);
        })
        .then(res => {
          console.log(res.body);
          console.log(tagList);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(tagList.length);
        });
    });

    it('should return an empty array for an incorrect query', () => {
      const searchTerm = 'NotValid';
      const search = new RegExp(searchTerm, 'i');
      let data;
      
      return Note.find({$or: [{ 'title': search }, { 'content': search }]})
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
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
          expect(res.body).to.have.keys('id', 'title', 'folderId', 'content', 'createdAt', 'updatedAt', 'tags');
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
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt', 'tags');
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

    it('should send status 400 and error message should be: `folderId` is not valid', () => {
      const newItem = {
        title: 'Note 1000',
        content: 'Content 1000',
        folderId: 'NOTEVALID'
      };
      return chai.request(app)
        .post('/api/notes/')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `folderId` is not valid');
        });
    });

    it('should send status 400 and error message should be: The tag `id` is not valid', () => {
      const newItem = {
        title: 'Note 1000',
        content: 'Content 1000',
        tags: ['NOT', 'VALID']
      };
      return chai.request(app)
        .post('/api/notes/')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The tag `id` is not valid');
        });
    });
  
  });

  ///////////////////////////////   PUT   ///////////////////////////////

  describe('PUT /api/notes/:id', () => {

    it('should update a note by id', () => {
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
          expect(res.body).to.have.keys('id', 'folderId', 'title', 'content', 'createdAt', 'updatedAt', 'tags');
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

    it('should send status 400 and error message should be: The tag `id` is not valid', () => {
      const updateItem = {
        title: 'Note 1000',
        content: 'Content 1000',
        tags: ['NOT', 'VALID']
      };
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/notes/${data.id}`).send(updateItem);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The tag `id` is not valid');
        });
      
    });

    it('should send status 400 and error message should be: Missing `title` in request body', () => {
      const updateItem = {content: 'Content 1000'};
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).put(`/api/notes/${data.id}`).send(updateItem);
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
          expect(res.body).to.be.empty;
          return Note.findById(data.id);
        })
        .then(res => {
          expect(res).to.equal(null);
        });
    });

    it('should send status 400 and error message should be: `id` is not valid', () => {
      return chai.request(app)
        .delete('/api/notes/NOTVALID')
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

  });
});