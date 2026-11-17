var sesionesModel = {}
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var SesionSchema = new Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    user_name: { type: String, required: true },
    rol: { type: String, required: true },
    tiempo_sesion: { type: Number, required: true },
    inicio: { type: Date, default: Date.now },
    expira: { type: Date, required: true },
    activa: { type: Boolean, default: true },
    cierre: { type: Date, default: null },
    motivo_cierre: { type: String, default: null }
  },
  { timestamps: true, collection: 'sesiones' }
);

const MyModel = mongoose.model('Sesion', SesionSchema);

sesionesModel.Crear = function (data, callback) {
    var instancia = new MyModel();
    instancia.usuario = data.usuario;
    instancia.user_name = data.user_name;
    instancia.rol = data.rol;
    instancia.tiempo_sesion = data.tiempo_sesion;
    instancia.expira = data.expira;

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

sesionesModel.BuscarPorId = function (data, callback) {
    MyModel.findById(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

sesionesModel.Guardar = function (data, callback) {
    data.instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = sesionesModel;
