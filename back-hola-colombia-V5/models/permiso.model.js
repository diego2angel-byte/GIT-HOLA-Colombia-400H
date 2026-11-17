var permisosModel = {}
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var PathPermitidoSchema = new Schema(
  {
    path: { type: String, required: true, trim: true },
    metodo: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      uppercase: true
    }
  },
  { _id: false }
);

var PermisoSchema = new Schema(
  {
    rol: { type: String, required: true, unique: true, trim: true, lowercase: true },
    paths: { type: [PathPermitidoSchema], default: [] }
  },
  { timestamps: true, collection: 'permisos' }
);

const MyModel = mongoose.model('Permiso', PermisoSchema);

permisosModel.Listar = function (callback) {
    MyModel.find().sort({ rol: 1 }).then(function (docs) {
        return callback(docs);
    }).catch(function (err) {
        return callback(null, err);
    });
}

permisosModel.ObtenerPorRol = function (data, callback) {
    MyModel.findOne({ rol: data.rol }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

permisosModel.CrearRol = function (data, callback) {
    var instancia = new MyModel();
    instancia.rol = data.rol;
    instancia.paths = data.paths || [];

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

permisosModel.ActualizarPaths = function (data, callback) {
    MyModel.findOneAndUpdate(
        { rol: data.rol },
        { paths: data.paths },
        { new: true, upsert: true }
    ).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = permisosModel;
