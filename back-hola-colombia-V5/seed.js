// Crea, si no existen, el usuario admin@admin.com y el rol admin con
// todos los paths permitidos. Se ejecuta automaticamente al levantar el
// server (server.js) y tambien se puede correr manualmente con:
//   npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/config');
const usuariosModel = require('./models/usuario.model');
const permisosModel = require('./models/permiso.model');
const { sha256 } = require('./utils/hash');

function seed() {
  return new Promise(function (resolve, reject) {
    // 1) Rol/permiso inicial: admin con acceso a todos los paths
    permisosModel.ObtenerPorRol({ rol: 'admin' }, function (permisoAdmin, err) {
      if (err) return reject(err);

      if (!permisoAdmin) {
        permisosModel.CrearRol({ rol: 'admin', paths: config.adminPaths }, function (nuevoPermiso, err2) {
          if (err2) return reject(err2);
          console.log('[seed] Rol "admin" creado con todos los paths permitidos.');
          crearUsuarioAdmin(nuevoPermiso, resolve, reject);
        });
      } else {
        var faltantes = config.pathsToures.filter(function (n) {
          return !permisoAdmin.paths.some(function (p) { return p.path === n.path && p.metodo === n.metodo; });
        });
        if (faltantes.length) {
          permisoAdmin.paths.push.apply(permisoAdmin.paths, faltantes);
          permisoAdmin.save().then(function () {
            console.log('[seed] Se agregaron ' + faltantes.length + ' path(s) de /toures al rol admin.');
            crearUsuarioAdmin(permisoAdmin, resolve, reject);
          }).catch(reject);
        } else {
          crearUsuarioAdmin(permisoAdmin, resolve, reject);
        }
      }
    });
  });
}

function crearUsuarioAdmin(permisoAdmin, resolve, reject) {
  // 2) Usuario administrador inicial
  usuariosModel.BuscarPorUserName({ user_name: config.adminEmail }, function (admin, err) {
    if (err) return reject(err);

    if (!admin) {
      usuariosModel.Crear({
        user_name: config.adminEmail.toLowerCase(),
        password: sha256(config.adminPassword),
        rol: 'admin',
        Activo: 'Si'
      }, function (nuevoAdmin, err2) {
        if (err2) return reject(err2);
        console.log('[seed] Usuario administrador creado: ' + config.adminEmail + ' / ' + config.adminPassword);
        resolve({ admin: nuevoAdmin, permisoAdmin: permisoAdmin });
      });
    } else {
      resolve({ admin: admin, permisoAdmin: permisoAdmin });
    }
  });
}

module.exports = seed;

// Permite ejecutar "node seed.js" de forma independiente
if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(seed)
    .then(function () {
      console.log('[seed] Listo.');
      process.exit(0);
    })
    .catch(function (err) {
      console.error(err);
      process.exit(1);
    });
}
