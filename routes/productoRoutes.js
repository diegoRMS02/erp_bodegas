const express = require("express");
const router = express.Router();
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

// Importamos las funciones del controlador
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
} = require("../controllers/productoController");

// Solo usuarios autenticados pueden ver productos
router.get("/", verificacionToken, obtenerProductos);
router.get("/:id", verificacionToken, obtenerProductoPorId);

// Solo administradores pueden crear, actualizar y eliminar
router.post("/crear", verificacionToken, verificacionAdmin, crearProducto);
router.put("/:id", verificacionToken, verificacionAdmin, actualizarProducto);
router.delete("/:id", verificacionToken, verificacionAdmin, eliminarProducto);

module.exports = router;
