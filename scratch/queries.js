'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');


// //get all
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = '';
//     let filter = {};

//     if (searchTerm) {
//       filter.title = { $regex: searchTerm };
//     }
//     return Note
//       .find(filter)
//       .sort({ updatedAt: 'desc' });
//   })    
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect();
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

// // get by id
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     return Note
//       .findById('000000000000000000000001')
//       .then(results => {
//         console.log(results);
//       })
//       .then(() =>{
//         return mongoose.disconnect();
//       })
//       .catch(err =>{
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//       });
//   });

// // Create
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     return Note
//       .create({
//         'title': 'Note 9',
//         'content': 'Content 9.'
//       })
//       .then(results => {
//         console.log(results);
//       })
//       .then(() =>{
//         return mongoose.disconnect();
//       })
//       .catch(err =>{
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//       });
//   });

// //Update
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     return Note
//       .findByIdAndUpdate('5b16e7872ab2a66e08322c10',
//         {
//           'title': 'Note 10',
//           'content': 'Content 10.'
//         }, {upsert:true, new: true})
//       .then(results => {
//         console.log(results);
//       })
//       .then(() =>{
//         return mongoose.disconnect();
//       })
//       .catch(err =>{
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//       });
//   });

// //Delete
// mongoose.connect(MONGODB_URI)
// .then(() => {
//   return Note
//     .findByIdAndRemove('5b16e7872ab2a66e08322c10')
//     .then(results => {
//       console.log(results);
//     })
//     .then(() =>{
//       return mongoose.disconnect();
//     })
//     .catch(err =>{
//       console.error(`ERROR: ${err.message}`);
//       console.error(err);
//     });
// });

