const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config/config');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'Hola-Colombia.jpg');
const LOGO_CID = 'logo-hola-colombia';
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function smtpConfigurado() {
  return !!config.smtp.usuario && !!config.smtp.clave;
}

function crearTransporte() {
  const { server, port, usuario, clave, starttls } = config.smtp;
  return nodemailer.createTransport({
    host: server,
    port,
    secure: port === 465,                 // 465 = SSL directo; 587 = STARTTLS
    requireTLS: starttls && port !== 465, // exige STARTTLS (smtp_starttls: True)
    auth: { user: usuario, pass: clave },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Marco comun de los correos de Hola Colombia: logo arriba, contenido en el medio y franja amarilla abajo. */
function envolverHtml(cuerpoHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px 24px 8px 24px;">
              <img src="cid:${LOGO_CID}" alt="Hola Colombia" width="150" style="display:block; border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px; color:#333333; font-size:15px; line-height:1.5;">
${cuerpoHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fff3b0; padding:12px; font-size:12px; color:#555555;">
              Hola Colombia &middot; Free Tour Libre
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function htmlAvisoPassword(userName, fecha) {
  return envolverHtml(`              <h2 style="margin:0 0 12px 0; color:#222222;">Tu contrase&ntilde;a fue cambiada</h2>
              <p style="margin:0 0 12px 0;">Hola <strong>${escaparHtml(userName)}</strong>,</p>
              <p style="margin:0 0 12px 0;">Te informamos que la contrase&ntilde;a de tu cuenta fue modificada el <strong>${escaparHtml(fecha)}</strong>.</p>
              <p style="margin:0;">Si no reconoces este cambio, comun&iacute;cate con el administrador lo antes posible.</p>`);
}

/** "2026-10-10" -> "sábado, 10 de octubre de 2026" (sin desfase de zona horaria) */
function formatearFechaReserva(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || ''));
  if (!m) return String(fecha || '');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** "15:30" -> "3:30 p. m." */
function formatearHoraReserva(hora) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hora || ''));
  if (!m) return String(hora || '');
  const h = Number(m[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** "2026-10-10" -> "10 de octubre" */
function formatearDiaMes(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || ''));
  if (!m) return String(fecha || '');
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function filaDetalle(etiqueta, valor) {
  return `                <tr>
                  <td style="padding:6px 0; color:#777777; width:90px;">${etiqueta}</td>
                  <td style="padding:6px 0; color:#222222;"><strong>${escaparHtml(valor)}</strong></td>
                </tr>`;
}

function tablaDetalles(filas) {
  return `              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbe6; border-left:4px solid #f7d54d; padding:8px 14px; margin:0 0 16px 0;">
${filas.join('\n')}
              </table>`;
}

/** Correo 1: la reserva se recibio y lleva el numero de reserva que el cliente debe digitar en la pagina. */
function htmlSolicitudReserva({ nombre, apellido, tour, fecha, hora, num_reserva }) {
  return envolverHtml(`              <h2 style="margin:0 0 12px 0; color:#222222;">Confirma tu reserva</h2>
              <p style="margin:0 0 12px 0;">Hola <strong>${escaparHtml(`${nombre} ${apellido}`.trim())}</strong>,</p>
              <p style="margin:0 0 12px 0;">Recibimos tu solicitud de reserva. Para confirmarla, escribe este n&uacute;mero en la ventana de confirmaci&oacute;n de la p&aacute;gina:</p>
              <div style="font-size:28px; font-weight:bold; letter-spacing:2px; text-align:center; background:#fff3b0; border-radius:6px; padding:14px; margin:0 0 16px 0; color:#3e2317;">${escaparHtml(num_reserva)}</div>
${tablaDetalles([
    filaDetalle('Tour', tour || 'Por confirmar'),
    filaDetalle('Fecha', formatearFechaReserva(fecha)),
    filaDetalle('Hora', formatearHoraReserva(hora))
  ])}
              <p style="margin:0 0 8px 0;">Si no digitas el n&uacute;mero, la reserva no queda confirmada. Puedes intentarlo las veces que necesites.</p>
              <p style="margin:0;">&iquest;Dudas? Escr&iacute;benos o ll&aacute;manos al 302-8288827.</p>`);
}

/** "nos vemos en Bogotá, a las 15:30 del 10 de octubre" (sin "en ..." si no se conoce la ciudad) */
function fraseEncuentro(ciudad, hora, fecha) {
  const lugar = ciudad ? `en ${ciudad}, ` : '';
  return `nos vemos ${lugar}a las ${hora} del ${formatearDiaMes(fecha)}`;
}

/** Correo 2: reserva CONFIRMADA. */
function htmlReservaConfirmada({ nombre, apellido, tour, fecha, hora, num_reserva }, ciudad) {
  const frase = fraseEncuentro(ciudad, hora, fecha);
  return envolverHtml(`              <h2 style="margin:0 0 12px 0; color:#222222;">&iexcl;Reserva CONFIRMADA!</h2>
              <p style="margin:0 0 12px 0;">Hola <strong>${escaparHtml(`${nombre} ${apellido}`.trim())}</strong>,</p>
              <p style="margin:0 0 16px 0;">Gracias por elegirnos, ${escaparHtml(frase)}, te contactaremos para indicarte el punto de encuentro.</p>
${tablaDetalles([
    filaDetalle('Reserva', num_reserva),
    filaDetalle('Tour', tour || 'Por confirmar'),
    filaDetalle('Fecha', formatearFechaReserva(fecha)),
    filaDetalle('Hora', formatearHoraReserva(hora))
  ])}
              <p style="margin:0;">Si necesitas cambiar o cancelar tu reserva, escr&iacute;benos o ll&aacute;manos al 302-8288827.</p>`);
}

function describirError(err) {
  if (err && err.code === 'EAUTH') {
    return 'El servidor SMTP rechazo las credenciales (revise SMTP_USUARIO y SMTP_CLAVE; Gmail requiere una contrasena de aplicacion).';
  }
  if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION' || err.code === 'ESOCKET' || err.code === 'EDNS')) {
    return 'No se pudo conectar con el servidor SMTP.';
  }
  return 'No se pudo enviar el correo de notificacion.';
}

/** Envio comun: valida destinatario y SMTP, manda el correo con el logo incrustado y NUNCA lanza excepcion. */
async function enviarCorreo({ destinatario, asunto, texto, html, transporte, exito }) {
  if (!REGEX_CORREO.test(String(destinatario || ''))) {
    return { enviado: false, mensaje: 'El correo del destinatario no es valido; no se envio la notificacion.' };
  }
  if (!transporte && !smtpConfigurado()) {
    return { enviado: false, mensaje: 'Correo no configurado (faltan SMTP_USUARIO y SMTP_CLAVE en el .env).' };
  }

  try {
    const t = transporte || crearTransporte();
    await t.sendMail({
      from: { name: config.smtp.remite, address: config.smtp.usuario },
      to: destinatario,
      subject: asunto,
      text: texto,
      html,
      attachments: [{ filename: 'Hola-Colombia.jpg', path: LOGO_PATH, cid: LOGO_CID }]
    });
    return { enviado: true, mensaje: exito };
  } catch (err) {
    console.error('Error enviando correo:', err.code || '', err.message);
    return { enviado: false, mensaje: describirError(err) };
  }
}

/**
 * Notifica al usuario que su contrasena cambio. NO incluye la contrasena.
 * Devuelve { enviado, mensaje }. `transporte` es opcional (se usa en pruebas).
 */
async function enviarAvisoCambioPassword(destinatario, transporte) {
  const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  return enviarCorreo({
    destinatario,
    transporte,
    asunto: 'Tu contrasena fue cambiada - Hola Colombia',
    texto:
      `Hola ${destinatario},\n\nTe informamos que la contrasena de tu cuenta fue modificada el ${fecha}.\n` +
      'Si no reconoces este cambio, comunicate con el administrador lo antes posible.\n\nHola Colombia',
    html: htmlAvisoPassword(destinatario, fecha),
    exito: `Notificacion enviada a ${destinatario}.`
  });
}

/**
 * Correo 1 (al guardar la reserva): incluye el num_reserva que el cliente debe digitar para confirmarla.
 * `reserva` = { nombre, apellido, email, fecha (YYYY-MM-DD), hora (HH:mm), tour, num_reserva }
 */
async function enviarSolicitudReserva(reserva, transporte) {
  const { nombre, apellido, email, fecha, hora, tour, num_reserva } = reserva;
  return enviarCorreo({
    destinatario: email,
    transporte,
    asunto: `Tu número de reserva ${num_reserva} - Hola Colombia`,
    texto:
      `Hola ${nombre} ${apellido},\n\nRecibimos tu solicitud de reserva. Para confirmarla, escribe este numero en la ventana de confirmacion de la pagina:\n\n` +
      `${num_reserva}\n\nTour: ${tour || 'Por confirmar'}\nFecha: ${formatearFechaReserva(fecha)}\nHora: ${formatearHoraReserva(hora)}\n\n` +
      'Si no digitas el numero, la reserva no queda confirmada. Puedes intentarlo las veces que necesites.\nDudas: 302-8288827\n\nHola Colombia',
    html: htmlSolicitudReserva(reserva),
    exito: `Correo con el numero de reserva enviado a ${email}.`
  });
}

/**
 * Correo 2 (al digitar bien el num_reserva): reserva CONFIRMADA.
 * `ciudad` es la ciudad del tour (puede ir vacia).
 */
async function enviarReservaConfirmada(reserva, ciudad, transporte) {
  const { nombre, apellido, email, fecha, hora, tour, num_reserva } = reserva;
  return enviarCorreo({
    destinatario: email,
    transporte,
    asunto: `Reserva CONFIRMADA ${num_reserva} - Hola Colombia`,
    texto:
      `Hola ${nombre} ${apellido},\n\nReserva CONFIRMADA.\n\n` +
      `Gracias por elegirnos, ${fraseEncuentro(ciudad, hora, fecha)}, te contactaremos para indicarte el punto de encuentro.\n\n` +
      `Reserva: ${num_reserva}\nTour: ${tour || 'Por confirmar'}\n\nHola Colombia`,
    html: htmlReservaConfirmada(reserva, ciudad),
    exito: `Confirmacion enviada a ${email}.`
  });
}

function mascaraUsuario(usuario) {
  const [local, dominio] = String(usuario).split('@');
  if (!dominio) return `${String(usuario).slice(0, 3)}***`;
  return `${local.slice(0, 3)}***@${dominio}`;
}

/**
 * Prueba el login SMTP (sin enviar ningun correo) y deja el resultado en la consola.
 * Nunca muestra la clave: solo su longitud. Devuelve true si Google/el servidor acepto las credenciales.
 */
async function verificarSmtp(transporte) {
  const { usuario, clave, server, port } = config.smtp;
  if (!transporte && !smtpConfigurado()) {
    console.warn('[correo] SMTP sin configurar: faltan SMTP_USUARIO y/o SMTP_CLAVE en el .env (no se enviaran correos).');
    return false;
  }

  const avisos = [];
  if (/^MI_USUARIO@/i.test(usuario) || /^MI_CLAVE/i.test(clave)) {
    avisos.push('el .env todavia tiene los valores de EJEMPLO (MI_USUARIO / MI_CLAVE): reemplacelos por los reales.');
  }
  if (server === 'smtp.gmail.com' && clave.length !== 16) {
    avisos.push(`una contrasena de aplicacion de Gmail tiene 16 caracteres y la leida tiene ${clave.length}.`);
  }
  if (server === 'smtp.gmail.com' && usuario && !/@(gmail|googlemail)\.com$/i.test(usuario)) {
    avisos.push('SMTP_USUARIO no es una direccion @gmail.com (debe ser la cuenta que genero la contrasena de aplicacion).');
  }

  console.log(`[correo] Probando SMTP ${server}:${port} con ${mascaraUsuario(usuario)} (clave de ${clave.length} caracteres)...`);
  try {
    await (transporte || crearTransporte()).verify();
    console.log('[correo] SMTP OK: el servidor acepto las credenciales.');
    avisos.forEach((a) => console.warn('[correo] Ojo: ' + a));
    return true;
  } catch (err) {
    console.error(`[correo] SMTP FALLO (${err.code || 'error'}): ${describirError(err)}`);
    avisos.forEach((a) => console.error('[correo] Posible causa: ' + a));
    if (err.code === 'EAUTH' && server === 'smtp.gmail.com') {
      console.error(
        '[correo] Revise: 1) SMTP_USUARIO es la misma cuenta que genero la contrasena de aplicacion; ' +
          '2) la clave es una contrasena de APLICACION (no la clave normal de Gmail); ' +
          '3) no se cambio la contrasena de la cuenta Google despues de crearla (eso revoca las contrasenas de aplicacion: genere una nueva).'
      );
    }
    return false;
  }
}

module.exports = { verificarSmtp, enviarAvisoCambioPassword, enviarSolicitudReserva, enviarReservaConfirmada, smtpConfigurado };
