var usuariosModel = {}
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { sha256 } = require('../utils/hash');

var UsuarioSchema = new Schema(
  {
    user_name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    rol: { type: String, required: true, default: 'usuario' },
    Activo: { type: String, enum: ['Si', 'No'], default: 'Si' },
    archivo_foto: { type: String, default: '' }
  },
  { timestamps: true, collection: 'usuarios' }
);

const MyModel = mongoose.model('Usuario', UsuarioSchema);

usuariosModel.Listar = function (callback) {
    MyModel.find({}, '-password').sort({ user_name: 1 }).then(function (docs) {
        return callback(docs);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.Crear = function (data, callback) {
    var hashRecibido = data.password.length === 64 ? data.password : sha256(data.password);

    var instancia = new MyModel();
    instancia.user_name = data.user_name.toLowerCase().trim();
    instancia.password = hashRecibido;
    instancia.rol = data.rol ? data.rol.toLowerCase().trim() : 'usuario';
    instancia.Activo = data.Activo === 'No' ? 'No' : 'Si';

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.BuscarPorUserName = function (data, callback) {
    MyModel.findOne({ user_name: data.user_name.toLowerCase().trim() }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.BuscarPorId = function (data, callback) {
    MyModel.findById(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.ActualizarRol = function (data, callback) {
    MyModel.findByIdAndUpdate(data._id, {
        rol: data.rol.toLowerCase().trim()
    }, { new: true, fields: '-password' }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.Actualizar = function (data, callback) {
    var cambios = {};
    if (data.rol) cambios.rol = data.rol.toLowerCase().trim();
    if (data.Activo) cambios.Activo = data.Activo === 'No' ? 'No' : 'Si';

    MyModel.findByIdAndUpdate(data._id, cambios, { new: true, fields: '-password' }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.ResetPassword = function (data, callback) {
    var hashRecibido = data.password.length === 64 ? data.password : sha256(data.password);

    MyModel.findByIdAndUpdate(data._id, {
        password: hashRecibido
    }, { new: true, fields: '-password' }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.ActualizarFoto = function (data, callback) {
    MyModel.findByIdAndUpdate(data._id, {
        archivo_foto: data.archivo_foto
    }, { new: true, fields: '-password' }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

usuariosModel.Eliminar = function (data, callback) {
    MyModel.findByIdAndDelete(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = usuariosModel;
