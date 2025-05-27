const CestaVenta = require("../models/cestaVentas");
const Producto = require("../models/Producto");

const agregarACesta = async (req, res) => {
  try {
    const { usuarioId, productos } = req.body;

    // Validación de datos
    if (!usuarioId || !productos || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar al menos un producto" });
    }

    let productosAgregados = [];

    for (let item of productos) {
      const { productoId, cantidad } = item;

      // Verificar si el producto existe
      const producto = await Producto.findByPk(productoId);
      if (!producto) {
        return res
          .status(404)
          .json({ error: `Producto ID ${productoId} no encontrado` });
      }

      // Verificar stock disponible
      if (producto.stock < cantidad) {
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${producto.nombre}` });
      }

      // Agregar producto a la cesta
      const productoCesta = await CestaVenta.create({
        usuarioId,
        productoId,
        cantidad,
      });
      productosAgregados.push(productoCesta);
    }

    res.status(201).json({
      mensaje: "Productos agregados a la cesta correctamente",
      cesta: productosAgregados,
    });
  } catch (error) {
    console.error("Error al agregar productos a la cesta:", error);
    res
      .status(500)
      .json({ error: "Error interno al agregar productos a la cesta" });
  }
};

module.exports = { agregarACesta };
