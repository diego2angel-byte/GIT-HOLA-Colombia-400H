var contactoController = {}
var contactoModel = require("../models/contacto.model.js");
var { validarCampos } = require("../utils/validaciones");

var CAMPOS_REQUERIDOS = ["nombre", "apellido", "edad", "email"];

contactoController.guardar = function (request, response) {
    var data = request.body;

    var resultado = validarCampos(data, CAMPOS_REQUERIDOS);
    if (!resultado.valido) {
        return response.json({ state: false, mensaje: resultado.mensaje });
    }

    contactoModel.Guardar({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        edad: Number(data.edad),
        email: data.email.trim(),
        tour: data.tour ? data.tour.trim() : ""
    }, function (doc, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al guardar: " + err.message });
        }
        response.json({ state: true, mensaje: "Contacto guardado correctamente" });
    });
}

contactoController.actualizar = function (request, response) {
    var data = request.body;

    if (!data.email || String(data.email).trim() === "") {
        return response.json({ state: false, mensaje: 'El campo "email" es requerido para actualizar' });
    }

    var resultado = validarCampos(data, CAMPOS_REQUERIDOS);
    if (!resultado.valido) {
        return response.json({ state: false, mensaje: resultado.mensaje });
    }

    contactoModel.BuscarPorEmail({ email: data.email.trim() }, function (ultimo, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al actualizar: " + err.message });
        }
        if (!ultimo) {
            return response.json({ state: false, mensaje: "Contacto no encontrado" });
        }

        ultimo.nombre = data.nombre.trim();
        ultimo.apellido = data.apellido.trim();
        ultimo.edad = Number(data.edad);
        ultimo.tour = data.tour ? data.tour.trim() : ultimo.tour;

        ultimo.save().then(function () {
            response.json({ state: true, mensaje: "Contacto actualizado correctamente" });
        }).catch(function (error) {
            response.json({ state: false, mensaje: "Error al actualizar: " + error.message });
        });
    });
}

contactoController.eliminar = function (request, response) {
    var email = request.body.email;

    if (!email || String(email).trim() === "") {
        return response.json({ state: false, mensaje: 'El campo "email" es requerido para eliminar' });
    }

    contactoModel.BuscarPorEmail({ email: email.trim() }, function (ultimo, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al eliminar: " + err.message });
        }
        if (!ultimo) {
            return response.json({ state: false, mensaje: "Contacto no encontrado" });
        }

        contactoModel.Eliminar({ _id: ultimo._id }, function (doc, err2) {
            if (err2) {
                return response.json({ state: false, mensaje: "Error al eliminar: " + err2.message });
            }
            response.json({ state: true, mensaje: "Contacto eliminado correctamente" });
        });
    });
}

contactoController.listarTodos = function (request, response) {
    contactoModel.ListarTodos(function (docs, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al listar: " + err.message });
        }
        response.json({ state: true, mensaje: "Consulta exitosa", total: docs.length, contactos: docs });
    });
}

module.exports = contactoController;
