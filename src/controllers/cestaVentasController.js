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

const obtenerCestaPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un ID de usuario" });
    }
    const productosCesta = await CestaVenta.findAll({
      where: { usuarioId },
      include: [
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio", "stock"],
        },
      ],
    });
    if (productosCesta.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "Cesta vacía o usuario no encontrado" });
    }
    res.status(200).json(productosCesta);
  } catch (error) {
    console.error("Error al obtener la cesta del usuario:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener la cesta del usuario" });
  }
};

const eliminarProductoDeCesta = async (req, res) => {
  try {
    const { usuarioId, productoId } = req.params;

    // Validación de datos
    if (!usuarioId || !productoId) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuario y producto" });
    }

    // Buscar el producto en la cesta
    const productoCesta = await CestaVenta.findOne({
      where: { usuarioId, productoId },
    });

    if (!productoCesta) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en la cesta" });
    }

    // Cambiar el estado a 'eliminado' en lugar de borrarlo
    await CestaVenta.update(
      { estado: "eliminado" },
      { where: { usuarioId, productoId } }
    );

    res.json({ mensaje: "Producto marcado como eliminado en la cesta" });
  } catch (error) {
    console.error("Error al eliminar producto de la cesta:", error);
    res
      .status(500)
      .json({ error: "Error interno al eliminar producto de la cesta" });
  }
};
module.exports = {
  agregarACesta,
  obtenerCestaPorUsuario,
  eliminarProductoDeCesta,
};
