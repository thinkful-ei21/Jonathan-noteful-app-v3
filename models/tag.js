'use strict';

const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name:{
    type:String,
    requiered: true,
    unique: true
  }
}, {timestamps:true});

tagSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model('Tag', tagSchema, 'tags');