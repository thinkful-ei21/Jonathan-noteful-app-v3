'use strict';

const express = require('express');
const Folder = require('../models/folder');
const Note = require('../models/note');
const router = express.Router();
const mongoose = require('mongoose');


//-------------GET ALL-------------//
router.get('/', (req, res, next) => {
  return Folder 
    .find()
    .sort({name: 'asc'})
    .then(results => {
      if(results) {
        res.json(results);
      }else next();
    })
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
  
  Folder.findById(id)   
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
  const newFolder = { name };

  if (!newFolder.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder
    .create(newFolder)
    
    .then(results => {
      if(results) {
        res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
      }else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
        err.status = 400;
      }
    }); 
});

//-------------PUT-------------//

router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const updateObj = { name };

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


  Folder.findByIdAndUpdate(id, updateObj, {new: true})
    .then(results => {
      if(results) {
        res.json(results);
      }else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Folder name already exists');
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
  
  Folder.findByIdAndRemove(id)
    // .then(() => Note.deleteMany({folderId:id}))
    .then(() => Note.updateMany({folderId:id}, {$unset: {folderId: null}}))
    .then(() => res.sendStatus(204))
    .catch(err => next(err)); 
});

module.exports = router;