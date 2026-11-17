var reservaController = {}
var reservaModel = require("../models/reserva.model.js");
var contadorModel = require("../models/contador.model.js");
var tourModel = require("../models/tour.model.js");
var { validarCampos } = require("../utils/validaciones");
var { enviarSolicitudReserva, enviarReservaConfirmada } = require("../services/correo");

var CAMPOS_REQUERIDOS = ["nombre", "apellido", "email", "fecha", "hora"];
var STATUS_VALIDOS = ["sin confirmar", "confirmada"];

var CIUDAD_TOURES_BASICOS = {
    "BOGOTA TOUR": "Bogotá",
    "BOLIVAR TOUR": "Bogotá",
    "ESMERALDAS TOUR": "Bogotá",
    "HISTORY & ART": "Bogotá"
};

function ciudadDelTour(nombreTour, callback) {
    if (CIUDAD_TOURES_BASICOS[nombreTour]) {
        return callback(CIUDAD_TOURES_BASICOS[nombreTour]);
    }
    tourModel.BuscarPorNombre({ nombre: nombreTour }, function (doc) {
        return callback(doc ? doc.ciudad : "");
    });
}

function siguienteNumReserva(callback) {
    var anio = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric" }).format(new Date());
    contadorModel.SiguienteSecuencia("reservas-" + anio, function (doc, err) {
        if (err) return callback(null, err);
        callback(anio + "-" + (999 + doc.seq));
    });
}

var COOKIE_RESERVA = "hc_reserva";

function leerEstadoReserva(req) {
    var valor = req.signedCookies && req.signedCookies[COOKIE_RESERVA];
    if (!valor) return null;
    var partes = String(valor).split(":");
    return { estado: partes[0], id: partes[1] };
}

function fijarEstadoReserva(res, estado, id) {
    var opciones = {
        httpOnly: true,
        sameSite: "lax",
        signed: true
    };
    res.cookie(COOKIE_RESERVA, estado + ":" + (id || ""), opciones);
}

reservaController.guardar = function (request, response) {
    var data = request.body || {};

    var resultado = validarCampos(data, CAMPOS_REQUERIDOS.concat(["tour"]));
    if (!resultado.valido) {
        return response.json({ state: false, mensaje: resultado.mensaje });
    }

    siguienteNumReserva(function (numReserva, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al guardar: " + err.message });
        }

        reservaModel.Guardar({
            nombre: data.nombre.trim(),
            apellido: data.apellido.trim(),
            email: data.email.trim(),
            fecha: data.fecha.trim(),
            hora: data.hora.trim(),
            tour: data.tour.trim(),
            num_reserva: numReserva,
            status: "sin confirmar"
        }, function (doc, err2) {
            if (err2) {
                return response.json({ state: false, mensaje: "Error al guardar: " + err2.message });
            }

            fijarEstadoReserva(response, "pendiente", doc._id);

            enviarSolicitudReserva(doc).then(function (correo) {
                response.json({
                    state: true,
                    mensaje: "Reserva registrada. Falta confirmarla con tu número de reserva.",
                    reserva_id: doc._id,
                    correo: correo
                });
            }).catch(function () {
                response.json({
                    state: true,
                    mensaje: "Reserva registrada. Falta confirmarla con tu número de reserva.",
                    reserva_id: doc._id,
                    correo: { enviado: false, mensaje: "No se pudo enviar el correo de notificacion." }
                });
            });
        });
    });
}

reservaController.confirmar = function (request, response) {
    var ingresado = String((request.body || {}).num_reserva || "").trim();
    if (!ingresado) {
        return response.json({ state: false, mensaje: "Debes ingresar el número de reserva." });
    }

    reservaModel.BuscarPorNumReserva({ num_reserva: ingresado }, function (reserva, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al confirmar: " + err.message });
        }
        if (!reserva) {
            return response.json({ state: false, mensaje: "Número de reserva incorrecto, intenta de nuevo." });
        }
        if (reserva.status === "confirmada") {
            return response.json({ state: true, mensaje: "Esta reserva ya fue confirmada anteriormente." });
        }

        reserva.status = "confirmada";
        reservaModel.Actualizar({ instancia: reserva }, function (doc, err2) {
            if (err2) {
                return response.json({ state: false, mensaje: "Error al confirmar: " + err2.message });
            }

            fijarEstadoReserva(response, "confirmada", reserva._id);

            ciudadDelTour(reserva.tour, function (ciudad) {
                enviarReservaConfirmada(reserva, ciudad).then(function (correo) {
                    response.json({ state: true, mensaje: "Reserva confirmada", correo: correo });
                }).catch(function () {
                    response.json({ state: true, mensaje: "Reserva confirmada", correo: { enviado: false, mensaje: "No se pudo enviar el correo de confirmacion." } });
                });
            });
        });
    });
}

reservaController.cancelar = function (request, response) {
    response.clearCookie(COOKIE_RESERVA);
    response.json({ state: true, mensaje: "Reserva cancelada. Puedes hacer una nueva reserva cuando quieras." });
}

reservaController.actualizar = function (request, response) {
    var data = request.body;

    if (!data.email || String(data.email).trim() === "") {
        return response.json({ state: false, mensaje: 'El campo "email" es requerido para actualizar' });
    }

    var resultado = validarCampos(data, CAMPOS_REQUERIDOS);
    if (!resultado.valido) {
        return response.json({ state: false, mensaje: resultado.mensaje });
    }

    reservaModel.BuscarPorEmail({ email: data.email.trim() }, function (ultima, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al actualizar: " + err.message });
        }
        if (!ultima) {
            return response.json({ state: false, mensaje: "Reserva no encontrada" });
        }

        ultima.nombre = data.nombre.trim();
        ultima.apellido = data.apellido.trim();
        ultima.fecha = data.fecha.trim();
        ultima.hora = data.hora.trim();

        if (data.tour !== undefined && String(data.tour).trim() !== "") {
            var validoTour = validarCampos(data, ["tour"]);
            if (!validoTour.valido) {
                return response.json({ state: false, mensaje: validoTour.mensaje });
            }
            ultima.tour = data.tour.trim();
        }

        if (request.sesion && data.status !== undefined && String(data.status).trim() !== "") {
            if (STATUS_VALIDOS.indexOf(data.status) === -1) {
                return response.json({ state: false, mensaje: 'El campo "status" solo permite: ' + STATUS_VALIDOS.join(" o ") });
            }
            ultima.status = data.status;
        }

        reservaModel.Actualizar({ instancia: ultima }, function (doc, err2) {
            if (err2) {
                return response.json({ state: false, mensaje: "Error al actualizar: " + err2.message });
            }
            response.json({ state: true, mensaje: "Reserva actualizada correctamente" });
        });
    });
}

reservaController.eliminar = function (request, response) {
    var email = request.body.email;

    if (!email || String(email).trim() === "") {
        return response.json({ state: false, mensaje: 'El campo "email" es requerido para eliminar' });
    }

    reservaModel.BuscarPorEmail({ email: email.trim() }, function (ultima, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al eliminar: " + err.message });
        }
        if (!ultima) {
            return response.json({ state: false, mensaje: "Reserva no encontrada" });
        }

        reservaModel.Eliminar({ _id: ultima._id }, function (doc, err2) {
            if (err2) {
                return response.json({ state: false, mensaje: "Error al eliminar: " + err2.message });
            }
            response.json({ state: true, mensaje: "Reserva eliminada correctamente" });
        });
    });
}

reservaController.listarTodos = function (request, response) {
    reservaModel.ListarTodos(function (docs, err) {
        if (err) {
            return response.json({ state: false, mensaje: "Error al listar: " + err.message });
        }

        var lista;
        if (request.sesion) {
            lista = docs;
        } else {
            lista = docs.map(function (r) {
                var o = r.toObject();
                delete o.num_reserva;
                return o;
            });
        }

        response.json({ state: true, mensaje: "Consulta exitosa", total: lista.length, reservas: lista });
    });
}

module.exports = reservaController;
