const express = require("express");
const router = express.Router();
const {
  agregarACesta,
  obtenerCestaPorUsuario,
  eliminarProductoDeCesta,
  cancelarCesta,
  eliminarCesta,
} = require("../controllers/cestaVentasController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

const { confirmarVenta } = require("../controllers/ventasController");

// Ruta para obtener la cesta de un usuario específico
router.get("/cesta/:usuarioId/", verificacionToken, obtenerCestaPorUsuario);
router.post("/cesta", verificacionToken, verificacionAdmin, agregarACesta);

//ventas
router.post("/confirmar", verificacionToken, confirmarVenta);

//eliminar producto de la cesta
router.delete(
  "/cesta/:usuarioId/:cestaId/:productoId",
  verificacionToken,
  verificacionAdmin,
  eliminarProductoDeCesta
);

//canccelar cesta
router.patch(
  "/cesta/:usuarioId/:cestaId/cancelar",
  verificacionToken,
  cancelarCesta
);
//elimnar cesta
router.delete(
  "/cesta/:usuarioId/:cestaId",
  verificacionToken,
  verificacionAdmin,
  eliminarCesta
);

module.exports = router;
