var authController = {}
var usuariosModel = require('../models/usuario.model.js');
var sesionesModel = require('../models/sesion.model.js');
var permisosModel = require('../models/permiso.model.js');
var { sha256 } = require('../utils/hash');
var config = require('../config/config');

function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: config.sessionMinutes * 60 * 1000
    };
}

authController.login = function (request, response) {
    var user_name = request.body.user_name;
    var password = request.body.password;

    if (!user_name || !password) {
        return response.status(400).json({ ok: false, mensaje: 'user_name y password son requeridos.' });
    }

    usuariosModel.BuscarPorUserName({ user_name: user_name }, function (usuario, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al iniciar sesion.' });
        }
        if (!usuario) {
            return response.status(401).json({ ok: false, mensaje: 'Credenciales invalidas.' });
        }
        if (usuario.Activo !== 'Si') {
            return response.status(403).json({ ok: false, mensaje: 'El usuario esta inactivo.' });
        }

        var hashRecibido = password.length === 64 ? password : sha256(password);
        if (hashRecibido !== usuario.password) {
            return response.status(401).json({ ok: false, mensaje: 'Credenciales invalidas.' });
        }

        var tiempoSesionSegundos = config.sessionMinutes * 60;

        sesionesModel.Crear({
            usuario: usuario._id,
            user_name: usuario.user_name,
            rol: usuario.rol,
            tiempo_sesion: tiempoSesionSegundos,
            expira: new Date(Date.now() + tiempoSesionSegundos * 1000)
        }, function (sesion, err2) {
            if (err2) {
                console.error(err2);
                return response.status(500).json({ ok: false, mensaje: 'Error interno al iniciar sesion.' });
            }

            response.cookie(config.sessionCookieName, sesion._id.toString(), cookieOptions());

            permisosModel.ObtenerPorRol({ rol: usuario.rol }, function (permiso) {
                response.json({
                    ok: true,
                    usuario: { user_name: usuario.user_name, rol: usuario.rol },
                    duracion_segundos: tiempoSesionSegundos,
                    expira: sesion.expira,
                    paths: permiso ? permiso.paths : []
                });
            });
        });
    });
}

authController.logout = function (request, response) {
    if (request.sesion) {
        request.sesion.activa = false;
        request.sesion.cierre = new Date();
        request.sesion.motivo_cierre = 'logout';
        sesionesModel.Guardar({ instancia: request.sesion }, function (doc, err) {
            if (err) {
                console.error(err);
                return response.status(500).json({ ok: false, mensaje: 'Error interno al cerrar sesion.' });
            }
            response.clearCookie(config.sessionCookieName);
            response.json({ ok: true, mensaje: 'Sesion cerrada.' });
        });
    } else {
        response.clearCookie(config.sessionCookieName);
        response.json({ ok: true, mensaje: 'Sesion cerrada.' });
    }
}

authController.estado = function (request, response) {
    var sesion = request.sesion;
    var segundosRestantes = Math.max(0, Math.round((sesion.expira.getTime() - Date.now()) / 1000));

    permisosModel.ObtenerPorRol({ rol: sesion.rol }, function (permiso) {
        response.json({
            ok: true,
            usuario: { user_name: sesion.user_name, rol: sesion.rol },
            segundos_restantes: segundosRestantes,
            duracion_segundos: sesion.tiempo_sesion,
            paths: permiso ? permiso.paths : []
        });
    });
}

authController.renovar = function (request, response) {
    var sesion = request.sesion;
    var segundos = config.sessionMinutes * 60;

    sesion.tiempo_sesion = segundos;
    sesion.expira = new Date(Date.now() + segundos * 1000);

    sesionesModel.Guardar({ instancia: sesion }, function (doc, err) {
        if (err) {
            console.error(err);
            return response.status(500).json({ ok: false, mensaje: 'Error interno al renovar la sesion.' });
        }

        response.cookie(config.sessionCookieName, sesion._id.toString(), cookieOptions());

        response.json({
            ok: true,
            segundos_restantes: segundos,
            duracion_segundos: segundos,
            expira: sesion.expira
        });
    });
}

module.exports = authController;
