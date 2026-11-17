var sesionesModel = require('../models/sesion.model');
var config = require('../config/config');

function requireSesion(req, res, next) {
    var sessionId = req.cookies[config.sessionCookieName];

    if (!sessionId) {
        return res.status(401).json({ ok: false, mensaje: 'No hay sesion activa. Inicie sesion.' });
    }

    sesionesModel.BuscarPorId({ _id: sessionId }, function (sesion, err) {
        if (err || !sesion || !sesion.activa) {
            res.clearCookie(config.sessionCookieName);
            return res.status(401).json({ ok: false, mensaje: 'Sesion invalida. Inicie sesion nuevamente.' });
        }

        if (sesion.expira.getTime() <= Date.now()) {
            sesion.activa = false;
            sesion.cierre = new Date();
            sesion.motivo_cierre = 'expirada';
            sesionesModel.Guardar({ instancia: sesion }, function () {
                res.clearCookie(config.sessionCookieName);
                return res.status(401).json({ ok: false, mensaje: 'La sesion ha expirado.' });
            });
            return;
        }

        req.sesion = sesion;
        req.usuarioActual = { id: sesion.usuario, user_name: sesion.user_name, rol: sesion.rol };
        next();
    });
}

function sesionOpcional(req, res, next) {
    var sessionId = req.cookies[config.sessionCookieName];
    if (!sessionId) {
        return next();
    }

    sesionesModel.BuscarPorId({ _id: sessionId }, function (sesion) {
        if (sesion && sesion.activa && sesion.expira.getTime() > Date.now()) {
            req.sesion = sesion;
            req.usuarioActual = { id: sesion.usuario, user_name: sesion.user_name, rol: sesion.rol };
        }
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.usuarioActual || req.usuarioActual.rol !== 'admin') {
        return res.status(403).json({ ok: false, mensaje: 'Requiere privilegios de administrador.' });
    }
    next();
}

module.exports = { requireSesion: requireSesion, sesionOpcional: sesionOpcional, requireAdmin: requireAdmin };
