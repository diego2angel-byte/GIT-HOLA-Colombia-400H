var contadorModel = {}
const mongoose = require('mongoose');
const conexion = require('../config/dbColombia');

var contadorSchema = new mongoose.Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { collection: 'hola-contadores', versionKey: false }
);

const MyModel = conexion.model('Contador', contadorSchema);

contadorModel.SiguienteSecuencia = function (prefijo, callback) {
  MyModel.findOneAndUpdate(
    { _id: prefijo },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).then(function (doc) {
    return callback(doc);
  }).catch(function (err) {
    return callback(null, err);
  });
}

module.exports = contadorModel;
