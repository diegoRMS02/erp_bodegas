const AuditoriaProducto = require("../models/auditoriaProducto");
const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");

// Obtener historial completo de auditorías de productos
const obtenerAuditorias = async (req, res) => {
  try {
    const auditorias = await AuditoriaProducto.findAll({
      include: [
        {
          model: Usuario,
          as: "Usuario", // Debe coincidir con el alias en la asociación
          attributes: ["id", "nombre", "correo"],
        },
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio"],
        },
      ],
      order: [["fecha", "DESC"]], // Ordena por fecha descendente (más recientes primero)
    });

    res.json(auditorias);
  } catch (error) {
    console.error("Error al obtener la auditoría:", error);
    res.status(500).json({ error: "Error al obtener la auditoría" }); // "error" estaba mal escrito como "eror"
  }
};

module.exports = {
  obtenerAuditorias,
};
