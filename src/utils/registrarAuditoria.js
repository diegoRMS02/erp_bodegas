const auditoriaProducto = require("../models/auditoriaProducto");

const registrarAuditoria = async ({
  usuarioId,
  productoId,
  accion,
  detalles,
}) => {
  try {
    await auditoriaProducto.create({
      usuarioId,
      productoId,
      accion,
      detalles,
    });
  } catch (error) {
    console.error("Error registrando auditoria", error);
  }
};

module.exports = registrarAuditoria;
