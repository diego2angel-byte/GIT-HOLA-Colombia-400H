const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reserva.controller");
const { sesionOpcional } = require("../middlewares/authMiddleware");

// sesionOpcional: si quien llama tiene sesion iniciada en el panel se le trata como administrador
// (ve el num_reserva, puede cambiar el status y no tiene el limite de una solicitud por sesion).
router.post("/Guardar", sesionOpcional, reservaController.guardar);
router.post("/Confirmar", reservaController.confirmar);
router.post("/Cancelar", reservaController.cancelar);
router.put("/Actualizar", sesionOpcional, reservaController.actualizar);
router.delete("/Eliminar", reservaController.eliminar);
router.get("/ListarTodos", sesionOpcional, reservaController.listarTodos);

module.exports = router;
