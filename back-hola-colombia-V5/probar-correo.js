// Uso:  node probar-correo.js              -> solo prueba el login SMTP con las credenciales del .env
//       node probar-correo.js tu@correo.com -> ademas envia un correo de prueba a esa direccion
require('dotenv').config();
const { verificarSmtp, enviarAvisoCambioPassword } = require('./services/correo');

(async () => {
  const ok = await verificarSmtp();
  const destino = process.argv[2];
  if (ok && destino) {
    const r = await enviarAvisoCambioPassword(destino);
    console.log('[correo] Envio de prueba:', r.mensaje);
  }
  process.exit(ok ? 0 : 1);
})();
