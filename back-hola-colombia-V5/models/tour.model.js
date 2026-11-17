var tourModel = {}
const mongoose = require('mongoose');
const conexion = require('../config/dbColombia');

var tourSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    ciudad: { type: String, required: true, trim: true, maxlength: 80 },
    descripcion: { type: String, required: true, trim: true, maxlength: 1500 },
    precio: { type: Number, required: true, min: 0 },
    foto: { type: String, default: '' }
  },
  { collection: 'hola-toures', versionKey: false, timestamps: false }
);

const MyModel = conexion.model('Tour', tourSchema);

tourModel.Guardar = function (data, callback) {
    var instancia = new MyModel();
    instancia.nombre = data.nombre;
    instancia.ciudad = data.ciudad;
    instancia.descripcion = data.descripcion;
    instancia.precio = data.precio;
    instancia.foto = data.foto || '';

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

tourModel.ListarTodos = function (callback) {
    MyModel.find().sort({ _id: 1 }).then(function (docs) {
        return callback(docs);
    }).catch(function (err) {
        return callback(null, err);
    });
}

tourModel.BuscarPorId = function (data, callback) {
    MyModel.findById(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

tourModel.Actualizar = function (data, callback) {
    MyModel.findByIdAndUpdate(data._id, data.cambios, { new: true, runValidators: true }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

tourModel.Eliminar = function (data, callback) {
    MyModel.findByIdAndDelete(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

tourModel.BuscarPorNombre = function (data, callback) {
    MyModel.findOne({ nombre: data.nombre }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = tourModel;
