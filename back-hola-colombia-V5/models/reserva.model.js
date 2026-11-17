var reservaModel = {}
const mongoose = require("mongoose");
const conexion = require("../config/dbColombia");

var reservaSchema = new mongoose.Schema(
    {
        nombre:   { type: String, required: true },
        apellido: { type: String, required: true },
        email:    { type: String, required: true },
        fecha:    { type: String, required: true },
        hora:     { type: String, required: true },
        tour:     { type: String, trim: true, default: "" },
        num_reserva: { type: String, trim: true, unique: true, sparse: true },
        status: { type: String, enum: ["sin confirmar", "confirmada"], default: "sin confirmar" }
    },
    { collection: "hola-reservas" }
);

const MyModel = conexion.model("Reserva", reservaSchema);

reservaModel.Guardar = function (data, callback) {
    var instancia = new MyModel();
    instancia.nombre = data.nombre;
    instancia.apellido = data.apellido;
    instancia.email = data.email;
    instancia.fecha = data.fecha;
    instancia.hora = data.hora;
    instancia.tour = data.tour || "";
    instancia.num_reserva = data.num_reserva;
    instancia.status = data.status || "sin confirmar";

    instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.ListarTodos = function (callback) {
    MyModel.find().sort({ fecha: -1, hora: -1 }).then(function (docs) {
        return callback(docs);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.BuscarPorEmail = function (data, callback) {
    MyModel.findOne({ email: data.email }).sort({ _id: -1 }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.BuscarPorId = function (data, callback) {
    MyModel.findById(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.Actualizar = function (data, callback) {
    data.instancia.save().then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.BuscarPorNumReserva = function (data, callback) {
    MyModel.findOne({ num_reserva: data.num_reserva }).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

reservaModel.Eliminar = function (data, callback) {
    MyModel.findByIdAndDelete(data._id).then(function (doc) {
        return callback(doc);
    }).catch(function (err) {
        return callback(null, err);
    });
}

module.exports = reservaModel;
