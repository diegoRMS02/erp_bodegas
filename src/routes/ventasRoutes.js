const express = require("express");
const router = express.Router();
const {
  agregarACesta,
  obtenerCestaPorUsuario,
  eliminarProductoDeCesta,
} = require("../controllers/cestaVentasController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

// Ruta para obtener la cesta de un usuario específico
router.get("/cesta/:usuarioId/", verificacionToken, obtenerCestaPorUsuario);
router.post("/cesta", verificacionToken, verificacionAdmin, agregarACesta);
router.delete(
  "/cesta/:usuarioId/:cestaId/:productoId",
  verificacionToken,
  verificacionAdmin,
  eliminarProductoDeCesta
);
module.exports = router;
