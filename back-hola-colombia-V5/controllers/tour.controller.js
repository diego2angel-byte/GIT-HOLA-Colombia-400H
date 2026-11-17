var tourController = {}
var tourModel = require('../models/tour.model.js');
var fs = require('fs');
var mongoose = require('mongoose');
var { uploadTour, esJpegReal, borrarFoto, mensajeError, MAX_MB_TOUR } = require('../middlewares/uploadFoto');

function recibirMultipart(req, res, callback) {
    uploadTour(req, res, function (err) {
        if (err) return callback(err);
        callback(null);
    });
}

function descartarArchivo(req) {
    if (req.file) fs.unlink(req.file.path, function () {});
}

function validarCampos(body) {
    var nombre = String(body.nombre || '').trim();
    var ciudad = String(body.ciudad || '').trim();
    var descripcion = String(body.descripcion || '').trim();
    var precioTexto = String(body.precio ?? '').trim();
    var precio = Number(precioTexto);

    if (!nombre) return { error: 'El campo "nombre" es obligatorio.' };
    if (!ciudad) return { error: 'El campo "ciudad" es obligatorio.' };
    if (!descripcion) return { error: 'El campo "descripcion" es obligatorio.' };
    if (precioTexto === '' || !Number.isFinite(precio) || precio < 0) {
        return { error: 'El campo "precio" debe ser un numero mayor o igual a 0.' };
    }
    if (nombre.length > 120) return { error: 'El nombre no puede superar 120 caracteres.' };
    if (ciudad.length > 80) return { error: 'La ciudad no puede superar 80 caracteres.' };
    if (descripcion.length > 1500) return { error: 'La descripcion no puede superar 1500 caracteres.' };
    return { datos: { nombre, ciudad, descripcion, precio } };
}

tourController.guardar = function (request, response) {
    recibirMultipart(request, response, function (errMultipart) {
        if (errMultipart) {
            return response.status(400).json({ state: false, mensaje: mensajeError(errMultipart, MAX_MB_TOUR) });
        }

        var resultado = validarCampos(request.body);
        if (resultado.error) {
            descartarArchivo(request);
            return response.status(400).json({ state: false, mensaje: resultado.error });
        }
        if (!request.file) {
            return response.status(400).json({ state: false, mensaje: 'Debe subir la foto del tour (JPG).' });
        }
        if (!esJpegReal(request.file.path)) {
            descartarArchivo(request);
            return response.status(400).json({ state: false, mensaje: 'El archivo no es un JPG valido.' });
        }

        var datosTour = resultado.datos;
        datosTour.foto = 'foto/' + request.file.filename;

        tourModel.Guardar(datosTour, function (doc, err) {
            if (err) {
                descartarArchivo(request);
                console.error(err);
                return response.status(500).json({ state: false, mensaje: 'Error interno al guardar el tour.' });
            }
            response.status(201).json({ state: true, mensaje: 'Tour guardado correctamente', tour: doc });
        });
    });
}

tourController.actualizar = function (request, response) {
    recibirMultipart(request, response, function (errMultipart) {
        if (errMultipart) {
            return response.status(400).json({ state: false, mensaje: mensajeError(errMultipart, MAX_MB_TOUR) });
        }

        var id = String(request.body._id || '').trim();
        if (!mongoose.isValidObjectId(id)) {
            descartarArchivo(request);
            return response.status(400).json({ state: false, mensaje: 'El campo "_id" es obligatorio y debe ser valido.' });
        }

        var resultado = validarCampos(request.body);
        if (resultado.error) {
            descartarArchivo(request);
            return response.status(400).json({ state: false, mensaje: resultado.error });
        }

        tourModel.BuscarPorId({ _id: id }, function (existente, err) {
            if (err) {
                descartarArchivo(request);
                console.error(err);
                return response.status(500).json({ state: false, mensaje: 'Error interno al actualizar el tour.' });
            }
            if (!existente) {
                descartarArchivo(request);
                return response.status(404).json({ state: false, mensaje: 'Tour no encontrado.' });
            }

            var fotoAnterior = existente.foto;
            var cambios = resultado.datos;

            if (request.file) {
                if (!esJpegReal(request.file.path)) {
                    descartarArchivo(request);
                    return response.status(400).json({ state: false, mensaje: 'El archivo no es un JPG valido.' });
                }
                cambios.foto = 'foto/' + request.file.filename;
            }

            tourModel.Actualizar({ _id: id, cambios: cambios }, function (doc, err2) {
                if (err2) {
                    descartarArchivo(request);
                    console.error(err2);
                    return response.status(500).json({ state: false, mensaje: 'Error interno al actualizar el tour.' });
                }
                if (request.file) borrarFoto(fotoAnterior);
                response.json({ state: true, mensaje: 'Tour actualizado correctamente', tour: doc });
            });
        });
    });
}

tourController.eliminar = function (request, response) {
    var id = String((request.body && request.body._id) || request.query._id || '').trim();
    if (!mongoose.isValidObjectId(id)) {
        return response.status(400).json({ state: false, mensaje: 'El campo "_id" es obligatorio y debe ser valido.' });
    }

    tourModel.Eliminar({ _id: id }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ state: false, mensaje: 'Error interno al eliminar el tour.' });
        }
        if (!doc) {
            return response.status(404).json({ state: false, mensaje: 'Tour no encontrado.' });
        }
        borrarFoto(doc.foto);
        response.json({ state: true, mensaje: 'Tour eliminado correctamente' });
    });
}

tourController.listarTodos = function (request, response) {
    tourModel.ListarTodos(function (docs, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ state: false, mensaje: 'Error interno al listar los toures.' });
        }
        response.json({ state: true, total: docs.length, toures: docs });
    });
}

module.exports = tourController;
