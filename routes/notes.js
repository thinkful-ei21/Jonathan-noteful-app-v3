'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const router = express.Router();

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tags } = req.query;


  mongoose.connect(MONGODB_URI)
    .then(() => {
      let filter = {};

      if (searchTerm) {
        filter = {$or: [{title: { $regex: searchTerm }}, {content: { $regex: searchTerm }}]};
      }
      return Note
        .find(filter)
        .sort({ updatedAt: 'desc' });
    })    
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => next(err)); 
});


/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      return Note
        .findById(id);
    })   
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => next(err)); 
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content } = req.body;
  const newItem = { title, content };

  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  mongoose.connect(MONGODB_URI)
    .then(() => {
      return Note
        .create(newItem);
    })
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => next(err)); 
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const id = req.params.id;

  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  mongoose.connect(MONGODB_URI)
    .then(() => {
      return Note
        .findByIdAndUpdate(id, updateObj, {new: true});
    })
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => next(err)); 
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      return Note
        .findByIdAndRemove(id);
    })
    .then(results => {
      if(results) {
        res.sendStatus(204);
      }else {
        next();
      }
    })
    .then(() => {
      return mongoose.disconnect();
    })
    .catch(err => next(err)); 
});

module.exports = router;