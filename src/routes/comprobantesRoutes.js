const express = require("express");
const router = express.Router();
const comprobantesController = require("../controllers/comprobantesController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");
const ComprobantesPago = require("../models/comprobantesPago"); // Asegúrate de que la ruta sea correcta
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

    // 🔹 Obtener el comprobante desde la BD
    const comprobante = await ComprobantesPago.findOne({
      where: { id: comprobanteId },
    });

    if (!comprobante) {
      return res.status(404).send("Comprobante no encontrado.");
    }

    // 🔄 **Formatear `fecha_emision` antes de enviarla al PDF**
    const fechaFormateada = new Date(
      comprobante.fecha_emision
    ).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    // 🔄 **Verificar y convertir `detalle` a JSON si es string**
    let detalleProductos;
    try {
      detalleProductos =
        typeof comprobante.detalle === "string"
          ? JSON.parse(comprobante.detalle)
          : comprobante.detalle;
    } catch (error) {
      console.error("Error al parsear detalle:", error);
      return res
        .status(500)
        .send("Error al procesar los productos del comprobante.");
    }

    // 🔄 **Transformar `detalle` para que coincida con la plantilla**
    const detalleFinal = detalleProductos.map((producto) => ({
      descripcion: producto.nombre, // 🔹 Mapeamos `nombre` a `descripcion`
      cantidad: producto.cantidad,
      precio_unitario: producto.precio, // 🔹 Mapeamos `precio` a `precio_unitario`
      subtotal: producto.precio * producto.cantidad,
      igv_item: producto.precio * producto.cantidad * 0.18,
      total_item: producto.precio * producto.cantidad * 1.18,
    }));

    // 🔹 Estructurar datos para el PDF
    const datosComprobante = {
      numero: comprobante.numero,
      serie: comprobante.serie,
      emisor_ruc: comprobante.emisor_ruc, // 🔹 Asegurar que `emisor_ruc` se pase correctamente
      fecha_emision: fechaFormateada, // 🔹 Ahora la fecha está en formato "1/06/2025"
      moneda: comprobante.moneda,
      cliente_nombre: comprobante.cliente_nombre,
      cliente_dni_ruc: comprobante.cliente_dni_ruc,
      subtotal: comprobante.subtotal,
      IGV: comprobante.IGV,
      total_final: comprobante.total_final,
      detalle: detalleFinal, // 🔹 Enviamos la estructura correcta a la plantilla
    };

    // 🔹 Generar el PDF con datos reales
    const pdfPath = await generarPdfComprobante(datosComprobante);

    res.sendFile(pdfPath);
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).send("Error generando el comprobante en PDF.");
  }
});
module.exports = router;
