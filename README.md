# Hola Colombia Tour
# ELABORADO POR DIEGO ANGEL

Sistema web de turismo con sitio público (tours, reservas, contacto) y panel administrativo con login, roles y permisos.

- **Frontend:** Angular + Bootstrap 5 + Notiflix (puerto `4200`)
- **Backend:** Node.js + Express + Mongoose (puerto `3000`)
- **Base de datos:** MongoDB (dos bases, ver más abajo)
- **Arquitectura:** MVC en ambos lados

---

## 1. Arquitectura general

```
Navegador ── Angular (4200) ──HTTP/JSON + cookie──▶ Express (3000) ──Mongoose──▶ MongoDB
                                                         │
                                                         └──▶ SMTP (correos de reservas)
```

Las peticiones del frontend usan `withCredentials: true` para enviar la cookie de sesión `session_id`.

### Bases de datos

| Base | Colecciones | Conexión |
|---|---|---|
| `hola_admin_sesiones` | usuarios, permisos, sesiones | `config/db.js` |
| `hola-colombia` | hola-reservas, hola-contactos, hola-toures, hola-contadores | `config/dbColombia.js` |

---

## 2. MVC en el proyecto

| Capa | Backend (Express) | Frontend (Angular) |
|---|---|---|
| **Modelo** | `models/*.js` (esquemas Mongoose) | `core/models.ts` (interfaces) y `services/*.service.ts` (llamadas HTTP) |
| **Vista** | Respuesta JSON | `*.component.html`, `*.css`, `styles.css` |
| **Controlador** | `controllers/*.js` y `middlewares/` | `*.component.ts` y `*.guard.ts` |
| **Rutas** | `routes/*.js` | `app-routing.module.ts` |

---

## 3. Estructura del backend

```
back-hola-colombia/
├── server.js              Arranque de Express, CORS, cookies y montaje de rutas
├── seed.js                Datos iniciales (usuario administrador y roles)
├── probar-correo.js       Prueba de la configuración SMTP
├── config/                config.js, db.js, dbColombia.js
├── routes/                authRoutes, usuariosRoutes, permisosRoutes,
│                          reserva.routes, tour.routes, contacto.routes
├── controllers/           Lógica de negocio de cada módulo
├── models/                Usuario, Sesion, Permiso, reserva, tour, contacto, contador
├── middlewares/           authMiddleware (sesión y admin), uploadFoto (multer)
├── services/correo.js     Envío de correos con nodemailer
├── utils/                 hash.js, validaciones.js
├── foto/                  Fotos subidas (se sirve en /foto)
└── tests/                 Pruebas unitarias Jest de los controladores
```

## 4. Estructura del frontend

```
src/app/
├── app-routing.module.ts      Rutas y guards
├── config/api.config.ts       URL base de la API
├── core/                      models, auth.service, permisos.service,
│                              auth.guard, admin.guard
├── services/                  reservas, tours, contacto
├── components/                header, footer
├── layouts/public-layout/     Marco del sitio público
├── layout/                    Marco del panel (menú lateral y temporizador de sesión)
└── pages/                     inicio, redes, toures, toures2, contacto, reservas,
                               login, dashboard, roles, apis, usuarios,
                               usuarios-crud, admin, admin-toures2
```

### Rutas del frontend

| Tipo | Rutas |
|---|---|
| Públicas | `/`, `/redes`, `/toures`, `/toures2`, `/contacto`, `/reservas` |
| Login | `/login` |
| Panel (requiere sesión) | `/dashboard`, `/roles`, `/apis`, `/usuarios`, `/usuarios-crud`, `/admin` |
| Solo administrador | `/admin_toures2` |

---

## 4. API del backend

Convención de verbos usada en los módulos de datos:

| Acción | Método y ruta |
|---|---|
| Crear | `POST /<modulo>/Guardar` |
| Actualizar | `PUT /<modulo>/Actualizar` |
| Eliminar | `DELETE /<modulo>/Eliminar` |
| Listar | `GET /<modulo>/ListarTodos` |

Módulos: `/reservas`, `/toures`, `/contactos`, además de `/auth`, `/usuarios` y `/permisos`.

Rutas adicionales:

- **Reservas:** `POST /reservas/Confirmar`, `POST /reservas/Cancelar`
- **Usuarios:** `PUT /usuarios/:id/rol`, `PUT /usuarios/:id/password`, `PUT /usuarios/:id/foto`
- **Auth:** login, logout y `POST /auth/renovar`
- **Toures:** guardar, actualizar y eliminar requieren rol administrador

---

## 5. Funcionalidades principales

### Sesiones y seguridad
- Cookie `session_id` (`httpOnly`, `sameSite=lax`) con duración configurable.
- Renovación deslizante de la sesión mientras el usuario está activo; el panel muestra un temporizador.
- Roles y permisos por ruta; los middlewares `requireSesion`, `sesionOpcional` y `requireAdmin` protegen el backend, y `AuthGuard` y `AdminGuard` protegen el frontend.
- Contraseñas almacenadas como hash SHA256.

### Reservas
1. El visitante envía la solicitud y se genera un número `<año>-<consecutivo>` con un contador atómico.
2. Estado inicial `sin confirmar`. Se envía un correo con el número de reserva.
3. El visitante confirma en un popup (Notiflix) con el número recibido por correo; solo hay un intento de confirmación.
4. Si es correcto, pasa a `confirmada` y se envía un correo de confirmación con ciudad, hora y fecha.
5. Una cookie firmada (`hc_reserva`) controla los estados pendiente, confirmada y bloqueada (bloqueo de 24 horas).
6. Límite de envío de correos por IP.
7. El número de reserva no se muestra a visitantes en el listado.

### Fotos
- Subida con `multer`, solo JPG, con validación de los bytes reales del archivo.
- Límites: 2 MB para usuarios y 5 MB para tours.
- Se sirven de forma estática en `/foto`.

---

## 6. Requisitos

- Node.js 18 o superior
- MongoDB accesible (local o remoto)
- Angular CLI
- Cuenta SMTP para el envío de correos (por ejemplo Gmail con contraseña de aplicación)

## 7. Configuración

En el backend, copia `.env.example` a `.env` y completa los valores. **Nunca subas `.env` a Git.**

| Variable | Descripción |
|---|---|
| `MONGO_URI` | Cadena de conexión a MongoDB |
| `COOKIE_SECRET` | Secreto para firmar cookies |
| `SESSION_MINUTES` | Duración de la sesión |
| `SMTP_SERVER` | Servidor SMTP |
| `SMTP_USUARIO` | Usuario SMTP |
| `SMTP_CLAVE` | Clave o contraseña de aplicación SMTP |
| `BACKEND_PORT` | Puerto opcional (por defecto 3000) |

En el frontend, la URL del backend se define en `src/environments/environment.ts` y `src/app/config/api.config.ts`.

## 8. Instalación y ejecución

**Backend**
```bash
cd back-hola-colombia
npm install
node seed.js        # solo la primera vez: crea el administrador y los roles
node server.js      # http://localhost:3000
```

**Frontend**
```bash
cd front-hola-colombia
npm install
ng serve            # http://localhost:4200
```

**Probar el correo**
```bash
node probar-correo.js
```

## 9. Pruebas

Pruebas unitarias con Jest que invocan directamente las funciones de los controladores con `req`/`res` simulados y modelos simulados (no necesitan base de datos).

```bash
npm test                # ejecuta las pruebas
npm run test:coverage   # incluye reporte de cobertura
```

## 10. Diseño

Paleta amarillo y café (`#f7d54d`, `#53381d`), Bootstrap 5 y notificaciones con Notiflix.

---

## Notas de seguridad

- No guardes credenciales en el repositorio; usa `.env`.
- Usa un `COOKIE_SECRET` largo y aleatorio.
- En producción, activa HTTPS y la cookie con `secure: true`.
- Restringe en el firewall el acceso al puerto de MongoDB.
