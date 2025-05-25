const AuditoriaCategoria = require("../models/auditoriaCategoria");
const Categoria = require("../models/Categoria");
const Usuario = require("../models/Usuario");

const obtenerAuditoriaCategorias = async (req, res) => {
  try {
    // Validación de autenticación
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Obtener auditoría de categorías
    const auditoriaCategorias = await AuditoriaCategoria.findAll({
      include: [
        {
          model: Usuario,
          as: "Usuario",
          attributes: ["id", "nombre", "correo"], // Ajusta según tu modelo Usuario
        },
        {
          model: Categoria,
          as: "Categoria",
          attributes: ["id", "nombre"], // Ajusta según tu modelo Categoria
        },
      ],
      order: [["fecha", "DESC"]], // Ordenar por fecha descendente
    });

    // Procesar los resultados para estructurar la respuesta como necesitas
    const auditoriaFormateada = auditoriaCategorias.map((auditoria) => ({
      id: auditoria.id,
      accion: auditoria.accion,
      detalles: JSON.parse(auditoria.detalles), // Convertir el string JSON a objeto
      fecha: auditoria.fecha,
      Usuario: auditoria.Usuario,
      Categoria: auditoria.Categoria, // Se mantiene tal como está en tu versión
    }));

    return res.status(200).json(auditoriaFormateada);
  } catch (error) {
    console.error("Error al obtener la auditoría de categorías:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerAuditoriaCategorias,
};
