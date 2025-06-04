const CestaVenta = require("../models/cestaVentas");
const Producto = require("../models/Producto");

// 🔄 **Agregar producto a la cesta sin modificar la lógica de ventas**
const agregarACesta = async (req, res) => {
  try {
    const { usuarioId, productos } = req.body;

    if (!usuarioId || !productos || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar al menos un producto." });
    }

    let productosCesta = [];

    for (const item of productos) {
      const productoBD = await Producto.findByPk(item.productoId);

      if (!productoBD) {
        return res
          .status(400)
          .json({ error: `El producto con ID ${item.productoId} no existe.` });
      }

      productosCesta.push({
        productoId: item.productoId,
        nombre: productoBD.nombre,
        precio: productoBD.precio,
        cantidad: item.cantidad || 1,
        categoriaId: productoBD.categoriaId,
      });
    }

    const nuevaCesta = await CestaVenta.create({
      usuarioId,
      productos: JSON.stringify(productosCesta),
      estado: "pendiente",
    });

    res.status(201).json({
      mensaje: `Nueva cesta creada con ID ${nuevaCesta.cestaId}.`,
      cestaId: nuevaCesta.cestaId,
      productos: nuevaCesta.productos,
    });
  } catch (error) {
    console.error("Error al agregar productos a la cesta:", error);
    res
      .status(500)
      .json({ error: "Error interno al agregar productos a la cesta." });
  }
};

// 🔄 **Obtener la cesta de un usuario**
const obtenerCestaPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un ID de usuario" });
    }

    const cestas = await CestaVenta.findAll({
      where: { usuarioId, estado: "pendiente" },
      attributes: ["cestaId", "productos"],
      order: [["cestaId", "DESC"]],
    });

    if (cestas.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "Cesta vacía o usuario no encontrado" });
    }

    res.status(200).json(cestas);
  } catch (error) {
    console.error("Error al obtener la cesta del usuario:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener la cesta del usuario." });
  }
};

// 🔄 **Eliminar un producto de la cesta**
const eliminarProductoDeCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId, productoId } = req.params;

    let cesta = await CestaVenta.findOne({
      where: { usuarioId, cestaId, estado: "pendiente" },
    });

    if (!cesta) {
      return res
        .status(404)
        .json({ error: "La cesta no existe o ya fue procesada." });
    }

    // Filtrar productos sin el que se quiere eliminar
    let productosActualizados = JSON.parse(cesta.productos).filter(
      (p) => p.productoId !== parseInt(productoId)
    );

    await CestaVenta.update(
      { productos: JSON.stringify(productosActualizados) },
      { where: { usuarioId, cestaId } }
    );

    res.json({
      mensaje: `Producto eliminado correctamente de la cesta ${cestaId}`,
    });
  } catch (error) {
    console.error("Error al eliminar producto de la cesta:", error);
    res
      .status(500)
      .json({ error: "Error interno al eliminar producto de la cesta." });
  }
};

// 🔄 **Cancelar una cesta**
const cancelarCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId } = req.params;

    const cestaExistente = await CestaVenta.findOne({
      where: { usuarioId, cestaId, estado: "pendiente" },
    });

    if (!cestaExistente) {
      return res
        .status(404)
        .json({ error: "La cesta no existe o ya fue cancelada." });
    }

    await CestaVenta.update(
      { estado: "cancelado" },
      { where: { usuarioId, cestaId } }
    );

    res.json({ mensaje: `Cesta ${cestaId} cancelada correctamente` });
  } catch (error) {
    console.error("Error al cancelar cesta:", error);
    res.status(500).json({ error: "Error interno al cancelar la cesta." });
  }
};

// 🔄 **Eliminar completamente una cesta**
const eliminarCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId } = req.params;

    const cestaExistente = await CestaVenta.findOne({
      where: { usuarioId, cestaId },
    });

    if (!cestaExistente) {
      return res.status(404).json({ error: "La cesta no existe." });
    }

    await CestaVenta.destroy({ where: { usuarioId, cestaId } });

    res.json({ mensaje: `Cesta ${cestaId} eliminada completamente.` });
  } catch (error) {
    console.error("Error al eliminar cesta:", error);
    res.status(500).json({ error: "Error interno al eliminar la cesta." });
  }
};

module.exports = {
  agregarACesta,
  obtenerCestaPorUsuario,
  eliminarProductoDeCesta,
  cancelarCesta,
  eliminarCesta,
};
