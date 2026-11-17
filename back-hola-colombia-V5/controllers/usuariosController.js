var usuariosController = {}
var usuariosModel = require('../models/usuario.model.js');
var fs = require('fs');
var mongoose = require('mongoose');
var { upload, esJpegReal, borrarFoto, mensajeError } = require('../middlewares/uploadFoto');
var { enviarAvisoCambioPassword } = require('../services/correo');

usuariosController.listar = function (request, response) {
    usuariosModel.Listar(function (docs, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al listar los usuarios.' });
        }
        response.json({ ok: true, usuarios: docs });
    });
}

usuariosController.crear = function (request, response) {
    var user_name = request.body.user_name;
    var password = request.body.password;
    var rol = request.body.rol;
    var Activo = request.body.Activo;

    if (!user_name || !password || !rol) {
        return response.status(400).json({ ok: false, mensaje: 'user_name, password y rol son requeridos.' });
    }

    usuariosModel.BuscarPorUserName({ user_name: user_name }, function (existe, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al crear el usuario.' });
        }
        if (existe) {
            return response.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese correo.' });
        }

        usuariosModel.Crear({
            user_name: user_name,
            password: password,
            rol: rol,
            Activo: Activo
        }, function (doc, err2) {
            if (err2) {
                console.error(err2);
                return response.status(500).json({ ok: false, mensaje: 'Error interno al crear el usuario.' });
            }
            var usuarioObj = doc.toObject();
            delete usuarioObj.password;
            response.status(201).json({ ok: true, usuario: usuarioObj });
        });
    });
}

usuariosController.actualizarRol = function (request, response) {
    var id = request.params.id;
    var rol = request.body.rol;

    if (!rol) {
        return response.status(400).json({ ok: false, mensaje: 'rol es requerido.' });
    }

    usuariosModel.ActualizarRol({ _id: id, rol: rol }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el rol.' });
        }
        if (!doc) {
            return response.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
        }
        response.json({ ok: true, usuario: doc });
    });
}

usuariosController.actualizar = function (request, response) {
    var id = request.params.id;

    usuariosModel.Actualizar({
        _id: id,
        rol: request.body.rol,
        Activo: request.body.Activo
    }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el usuario.' });
        }
        if (!doc) {
            return response.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
        }
        response.json({ ok: true, usuario: doc });
    });
}

usuariosController.resetPassword = function (request, response) {
    var id = request.params.id;
    var password = request.body.password;

    if (!password) {
        return response.status(400).json({ ok: false, mensaje: 'password es requerido.' });
    }

    usuariosModel.ResetPassword({ _id: id, password: password }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al restablecer la contrasena.' });
        }
        if (!doc) {
            return response.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
        }

        enviarAvisoCambioPassword(doc.user_name).then(function (correo) {
            response.json({ ok: true, mensaje: 'Contrasena restablecida.', usuario: doc, correo: correo });
        }).catch(function () {
            response.json({ ok: true, mensaje: 'Contrasena restablecida.', usuario: doc, correo: { enviado: false, mensaje: 'No se pudo enviar el correo de notificacion.' } });
        });
    });
}

usuariosController.subirFoto = function (request, response) {
    var id = request.params.id;

    if (!mongoose.isValidObjectId(id)) {
        return response.status(400).json({ ok: false, mensaje: 'Id de usuario invalido.' });
    }

    usuariosModel.BuscarPorId({ _id: id }, function (usuario, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al subir la foto.' });
        }
        if (!usuario) {
            return response.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
        }

        upload(request, response, function (errUpload) {
            if (errUpload) {
                return response.status(400).json({ ok: false, mensaje: mensajeError(errUpload) });
            }
            if (!request.file) {
                return response.status(400).json({ ok: false, mensaje: 'Debe enviar la foto en el campo "foto".' });
            }
            if (!esJpegReal(request.file.path)) {
                fs.unlink(request.file.path, function () {});
                return response.status(400).json({ ok: false, mensaje: 'El archivo no es un JPG valido.' });
            }

            var anterior = usuario.archivo_foto;

            usuariosModel.ActualizarFoto({
                _id: id,
                archivo_foto: 'foto/' + request.file.filename
            }, function (doc, err2) {
                if (err2) {
                    console.error(err2);
                    return response.status(500).json({ ok: false, mensaje: 'Error interno al guardar la foto.' });
                }
                borrarFoto(anterior);
                response.json({ ok: true, mensaje: 'Foto actualizada.', usuario: doc });
            });
        });
    });
}

usuariosController.eliminar = function (request, response) {
    var id = request.params.id;

    usuariosModel.Eliminar({ _id: id }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al eliminar el usuario.' });
        }
        if (!doc) {
            return response.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
        }
        borrarFoto(doc.archivo_foto);
        response.json({ ok: true, mensaje: 'Usuario eliminado.' });
    });
}

module.exports = usuariosController;
