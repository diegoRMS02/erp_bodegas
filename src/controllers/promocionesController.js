const PromocionesDescuentos = require("../models/promocionesDescuentos");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const { Op } = require("sequelize");

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
      codigo_promocional,
      cantidad_minima, // 🔹 Nuevo campo para definir cantidad mínima en promociones
      acumulable,
      creadoPor,
    } = req.body;

    // 🔍 **Verificar que se envíen todos los campos requeridos**
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

    // 🔄 **Validar que la fecha de inicio sea anterior a la fecha de fin**
    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return res.status(400).json({
        error: "La fecha de inicio debe ser anterior a la fecha de fin.",
      });
    }

    // 🔄 **Validar si el producto existe en la BD**
    if (productoId) {
      const productoExiste = await Producto.findByPk(productoId);
      if (!productoExiste) {
        return res
          .status(400)
          .json({ error: `El producto con ID ${productoId} no existe.` });
      }
    }

    // 🔄 **Validar si la categoría existe en la BD**
    if (categoriaId) {
      const categoriaExiste = await Categoria.findByPk(categoriaId);
      if (!categoriaExiste) {
        return res
          .status(400)
          .json({ error: `La categoría con ID ${categoriaId} no existe.` });
      }
    }

    // 🔍 **Si el tipo es 'codigo', debe tener un `codigo_promocional` válido**
    if (tipo === "codigo" && !codigo_promocional) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un código promocional válido." });
    }

    // 🔄 **Validar cantidad mínima en promociones**
    if (!cantidad_minima || cantidad_minima < 1) {
      cantidad_minima = 1; // 🔹 Si no se proporciona cantidad mínima, establecer en 1 por defecto.
    }

    // 🔄 **Crear la promoción con los datos validados**
    const nuevaPromocion = await PromocionesDescuentos.create({
      nombre_promocion,
      tipo,
      valor_descuento,
      productoId: productoId || null,
      categoriaId: categoriaId || null,
      fecha_inicio,
      fecha_fin,
      codigo_promocional: codigo_promocional || null,
      cantidad_minima, // 🔹 Ahora registramos correctamente la cantidad mínima
      acumulable: acumulable || false,
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
    const hoy = new Date();

    const promociones = await PromocionesDescuentos.findAll({
      where: {
        estado: "activo",
        fecha_inicio: { [Op.lte]: hoy }, // 🔹 Solo mostrar promociones activas dentro del rango de fechas
        fecha_fin: { [Op.gte]: hoy },
      },
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
