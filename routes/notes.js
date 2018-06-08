'use strict';

const express = require('express');
const Note = require('../models/note');
const router = express.Router();
const mongoose = require('mongoose');


/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tags } = req.query;

  let filter = {};

  if (searchTerm) {
    filter = {$or: [{title: { $regex: searchTerm }}, {content: { $regex: searchTerm }}]};
  }
  return Note
    .find(filter)
    .sort({ updatedAt: 'desc' })
        
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => next(err)); 
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Note.findById(id)   
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => next(err)); 
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId } = req.body;
  
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  const newNote = { title, content, folderId };

  Note.create(newNote)
    .then(results => {
      res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
    })
    .catch(err => next(err)); 
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateNote = { title, content, folderId };

  Note.findByIdAndUpdate(id, updateNote, {new: true})
    
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => next(err)); 
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  Note.findByIdAndRemove(id)
    .then(results => {
      if(results) {
        res.sendStatus(204);
      }else {
        next();
      }
    })
    .catch(err => next(err)); 
});

module.exports = router;