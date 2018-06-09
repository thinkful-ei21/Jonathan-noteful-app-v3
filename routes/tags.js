'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');

const router = express.Router();


//-------------GET ALL-------------//

router.get('/', (req, res, next) => {
  return Tag.find().sort({name: 'asc'})
    .then(results => res.json(results))
    .catch(err => next(err));
});

//-------------GET BY ID-------------//

router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Tag.findById(id)   
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => next(err)); 
});

//-------------POST-------------//

router.post('/', (req, res, next) => {
  const { name } = req.body;
  const newTag = { name };

  if (!newTag.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(results => res.location(`${req.originalUrl}/${results.id}`).status(201).json(results))
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    }); 
});

//-------------PUT-------------//

router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const updateTag = { name };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndUpdate(id, updateTag, {new: true})
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Tag name already exists');
        err.status = 400;
      }
      next(err);
    }); 
});

//-------------DELETE-------------//

router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  
  Tag.findByIdAndRemove(id)
    .then(() => Note.updateMany({tags:id}, {$pull: {tags: id}}))
    .then(() => res.sendStatus(204))
    .catch(err => next(err)); 
});

module.exports = router;