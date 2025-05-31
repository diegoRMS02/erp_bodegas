const express = require("express");
const router = express.Router();
const comprobantesController = require("../controllers/comprobantesController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");
const Comprobante = require("../models/comprobantesPago"); // Asegúrate de que la ruta sea correcta
const generarPdfComprobante = require("../services/generarPdfComprobante");
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

router.get("/:id/pdf", async (req, res) => {
  try {
    const comprobanteId = req.params.id;

    // 🔹 Obtener datos reales del comprobante desde la base de datos
    const comprobante = await Comprobante.findOne({
      where: { id: comprobanteId },
    });

    // 🔹 Validar si existe el comprobante
    if (!comprobante) {
      return res.status(404).send("Comprobante no encontrado.");
    }

    // 🔹 Estructurar datos para la plantilla
    const datosComprobante = {
      numero: comprobante.numero,
      logo_empresa:
        comprobante.logo_empresa || "https://via.placeholder.com/100",
      emisor_razon_social: comprobante.emisor_razon_social,
      emisor_ruc: comprobante.emisor_ruc,
      emisor_direccion: comprobante.emisor_direccion,
      emisor_telefono: comprobante.emisor_telefono,
      tipo: comprobante.tipo,
      serie: comprobante.serie,
      fecha_emision: comprobante.fecha_emision,
      fecha_vencimiento: comprobante.fecha_vencimiento,
      moneda: comprobante.moneda,
      cliente_nombre: comprobante.cliente_nombre,
      cliente_dni_ruc: comprobante.cliente_dni_ruc,
      subtotal: comprobante.subtotal,
      IGV: comprobante.IGV,
      total_final: comprobante.total_final,
      detalle: comprobante.detalle, // Asegurar que esto sea un array con productos
    };

    // 🔹 Generar el PDF con los datos reales
    const pdfPath = await generarPdfComprobante(datosComprobante);

    // 🔹 Enviar el PDF al usuario
    res.sendFile(pdfPath);
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).send("Error generando el comprobante en PDF.");
  }
});

module.exports = router;
