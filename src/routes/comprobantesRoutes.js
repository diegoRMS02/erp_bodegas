const express = require("express");
const router = express.Router();
const comprobantesController = require("../controllers/comprobantesController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

router.post(
  "/crear",
  verificacionToken,
  verificacionAdmin,
  comprobantesController.crearComprobante
);

// Ruta para obtener un comprobante por ID
router.get(
  "/",
  verificacionToken,
  verificacionAdmin,
  comprobantesController.obtenerComprobantes
);

// Ruta para buscar un comprobante por ID o serie
router.get(
  "/buscar/:id/",
  verificacionToken,
  verificacionAdmin,
  comprobantesController.buscarComprobante
);

// Ruta para editar un comprobante por ID
router.put(
  "/editar/:id",
  verificacionToken,
  verificacionAdmin,
  comprobantesController.editarComprobante
);

// Ruta para eliminar un comprobante por ID (soft delete)
router.delete(
  "/eliminar/:id",
  verificacionToken,
  verificacionAdmin,
  comprobantesController.eliminarComprobante
);
module.exports = router;
