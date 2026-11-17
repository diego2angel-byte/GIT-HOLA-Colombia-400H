var contactoModel = {}
const mongoose = require("mongoose");
const conexion = require("../config/dbColombia");

var contactoSchema = new mongoose.Schema(
    {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        edad: { type: Number, required: true },
        email: { type: String, required: true },
        tour: { type: String, required: true },
        fechaRegistro: { type: Date, default: Date.now }
    },
    { collection: "hola-contactos" }
);

const MyModel = conexion.model("Contacto", contactoSchema);

contactoModel.Guardar = function (data, callback) {
    var instancia = new MyModel();
    instancia.nombre = data.nombre;
    instancia.apellido = data.apellido;
    instancia.edad = data.edad;
    instancia.email = data.email;
    instancia.tour = data.tour || "";

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

contactoModel.ListarTodos = function (callback) {
    MyModel.find().sort({ fechaRegistro: -1 }).then(function (docs) {
        return callback(docs);
    }).catch(function (err) {
        return callback(null, err);
    });
}

contactoModel.BuscarPorEmail = function (data, callback) {
    MyModel.findOne({ email: data.email }).sort({ _id: -1 }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

contactoModel.Actualizar = function (data, callback) {
    MyModel.findByIdAndUpdate(data._id, {
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad,
        tour: data.tour
    }, { returnDocument: 'after' }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

contactoModel.Eliminar = function (data, callback) {
    MyModel.findByIdAndDelete(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = contactoModel;
