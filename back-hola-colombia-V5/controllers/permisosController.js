var permisosController = {}
var permisosModel = require('../models/permiso.model.js');

permisosController.listar = function (request, response) {
    permisosModel.Listar(function (docs, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al listar los permisos.' });
        }
        response.json({ ok: true, permisos: docs });
    });
}

permisosController.obtenerPorRol = function (request, response) {
    var rol = request.params.rol;

    permisosModel.ObtenerPorRol({ rol: rol.toLowerCase().trim() }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al obtener los permisos.' });
        }
        response.json({ ok: true, rol: rol, paths: doc ? doc.paths : [] });
    });
}

permisosController.crearRol = function (request, response) {
    var rol = request.body.rol;
    if (!rol) {
        return response.status(400).json({ ok: false, mensaje: 'rol es requerido.' });
    }

    var rolNormalizado = rol.toLowerCase().trim();

    permisosModel.ObtenerPorRol({ rol: rolNormalizado }, function (existe, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al crear el rol.' });
        }
        if (existe) {
            return response.status(409).json({ ok: false, mensaje: 'Ese rol ya existe.' });
        }

        permisosModel.CrearRol({ rol: rolNormalizado, paths: [] }, function (doc, err2) {
            if (err2) {
                console.error(err2);
                return response.status(500).json({ ok: false, mensaje: 'Error interno al crear el rol.' });
            }
            response.status(201).json({ ok: true, permiso: doc });
        });
    });
}

permisosController.actualizarPaths = function (request, response) {
    var rol = request.params.rol;
    var paths = request.body.paths;

    if (!Array.isArray(paths)) {
        return response.status(400).json({ ok: false, mensaje: 'paths debe ser un arreglo.' });
    }

    permisosModel.ActualizarPaths({ rol: rol.toLowerCase().trim(), paths: paths }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al actualizar los paths.' });
        }
        response.json({ ok: true, permiso: doc });
    });
}

module.exports = permisosController;
