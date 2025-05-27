const express = require("express");
const router = express.Router();
const {
  agregarACesta,
  obtenerCestaPorUsuario,
} = require("../controllers/cestaVentasController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

// Ruta para obtener la cesta de un usuario específico
router.get("/cesta/:usuarioId", verificacionToken, obtenerCestaPorUsuario);
router.post("/cesta", verificacionToken, verificacionAdmin, agregarACesta);

module.exports = router;
