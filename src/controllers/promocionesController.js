const PromocionesDescuentos = require("../models/promocionesDescuentos");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");

const crearPromocion = async (req, res) => {
  try {
    const {
      nombre_promocion,
      tipo,
      valor_descuento,
      productoId,
      categoriaId,
      fecha_inicio,
      fecha_fin,
      creadoPor,
    } = req.body;

    // Verificar que se envíen todos los campos requeridos
    if (
      !nombre_promocion ||
      !tipo ||
      !valor_descuento ||
      !fecha_inicio ||
      !fecha_fin ||
      !creadoPor
    ) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar todos los campos obligatorios." });
    }

    // Validar si el producto existe en la base de datos
    if (productoId) {
      const productoExiste = await Producto.findByPk(productoId);
      if (!productoExiste) {
        return res
          .status(400)
          .json({ error: `El producto con ID ${productoId} no existe.` });
      }
    }

    // Validar si la categoría existe en la base de datos
    if (categoriaId) {
      const categoriaExiste = await Categoria.findByPk(categoriaId);
      if (!categoriaExiste) {
        return res
          .status(400)
          .json({ error: `La categoría con ID ${categoriaId} no existe.` });
      }
    }

    // Crear la promoción con los datos validados
    const nuevaPromocion = await PromocionesDescuentos.create({
      nombre_promocion,
      tipo,
      valor_descuento,
      productoId: productoId || null, // Si no hay producto, guardar como NULL
      categoriaId: categoriaId || null, // Si no hay categoría, guardar como NULL
      fecha_inicio,
      fecha_fin,
      creadoPor,
    });

    res.status(201).json({
      mensaje: "Promoción creada correctamente",
      promocion: nuevaPromocion,
    });
  } catch (error) {
    console.error("Error al crear promoción:", error);
    res.status(500).json({ error: "Error interno al crear la promoción." });
  }
};

const obtenerPromociones = async (req, res) => {
  try {
    const promociones = await PromocionesDescuentos.findAll({
      where: { estado: "activo" },
      include: [
        { model: Producto, as: "Producto", attributes: ["nombre", "precio"] },
        { model: Categoria, as: "Categoria", attributes: ["nombre"] },
      ],
    });

    res.status(200).json(promociones);
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    res.status(500).json({ error: "Error interno al obtener promociones." });
  }
};

module.exports = { crearPromocion, obtenerPromociones };
