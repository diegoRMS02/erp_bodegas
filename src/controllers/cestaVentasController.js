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

    // Obtener el último `cestaId` del usuario o generar uno nuevo
    let ultimaCesta = await CestaVenta.findOne({
      where: { usuarioId },
      order: [["createdAt", "DESC"]],
    });

    const nuevaCestaId = ultimaCesta ? ultimaCesta.cestaId + 1 : 1;

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

      // Agregar producto a la cesta con un `cestaId` único
      const productoCesta = await CestaVenta.create({
        cestaId: nuevaCestaId,
        usuarioId,
        productoId,
        cantidad,
        estado: "pendiente",
      });

      productosAgregados.push(productoCesta);
    }

    res.status(201).json({
      mensaje: `Productos agregados a la cesta ${nuevaCestaId} correctamente`,
      cestaId: nuevaCestaId,
      productos: productosAgregados,
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

    // Obtener productos en la cesta organizados por `cestaId`
    const productosCesta = await CestaVenta.findAll({
      where: { usuarioId, estado: "pendiente" },
      attributes: ["cestaId", "productoId", "cantidad"],
      include: [
        {
          model: Producto,
          as: "Producto",
          attributes: ["id", "nombre", "precio", "stock"],
        },
      ],
      order: [["cestaId", "DESC"]], // Mostrar primero las cestas más recientes
    });

    if (productosCesta.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "Cesta vacía o usuario no encontrado" });
    }

    // Agrupar productos por `cestaId`
    const cestasAgrupadas = productosCesta.reduce((acc, item) => {
      const { cestaId, productoId, cantidad, Producto } = item;

      if (!acc[cestaId]) {
        acc[cestaId] = { cestaId, productos: [] };
      }

      acc[cestaId].productos.push({
        productoId,
        nombre: Producto.nombre,
        precio: Producto.precio,
        cantidad,
        stock: Producto.stock,
      });

      return acc;
    }, {});

    // Convertir objeto agrupado en array
    const respuestaFinal = Object.values(cestasAgrupadas);

    res.status(200).json(respuestaFinal);
  } catch (error) {
    console.error("Error al obtener la cesta del usuario:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener la cesta del usuario" });
  }
};

const eliminarProductoDeCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId, productoId } = req.params;

    if (!usuarioId || !cestaId || !productoId) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar usuario, cesta y producto válidos" });
    }

    const productoEnCesta = await CestaVenta.findOne({
      where: { usuarioId, cestaId, productoId, estado: "pendiente" },
    });

    if (!productoEnCesta) {
      return res
        .status(404)
        .json({ error: "El producto no está en la cesta o ya fue eliminado" });
    }

    await CestaVenta.update(
      { estado: "eliminado" },
      { where: { usuarioId, cestaId, productoId } }
    );

    res.json({
      mensaje: `Producto eliminado correctamente de la cesta ${cestaId}`,
    });
  } catch (error) {
    console.error("Error al eliminar producto de la cesta:", error);
    res
      .status(500)
      .json({ error: "Error interno al eliminar producto de la cesta" });
  }
};

//cancelar cesta
const cancelarCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId } = req.params;

    const cestaExistente = await CestaVenta.findOne({
      where: { usuarioId, cestaId, estado: "pendiente" },
    });

    if (!cestaExistente) {
      return res
        .status(404)
        .json({ error: "La cesta no existe o ya fue cancelada" });
    }

    await CestaVenta.update(
      { estado: "cancelado" },
      { where: { usuarioId, cestaId } }
    );

    res.json({ mensaje: `Cesta ${cestaId} cancelada correctamente` });
  } catch (error) {
    console.error("Error al cancelar cesta:", error);
    res.status(500).json({ error: "Error interno al cancelar la cesta" });
  }
};

//eliminar cesta
const eliminarCesta = async (req, res) => {
  try {
    const { usuarioId, cestaId } = req.params;

    const cestaExistente = await CestaVenta.findOne({
      where: { usuarioId, cestaId },
    });

    if (!cestaExistente) {
      return res.status(404).json({ error: "La cesta no existe" });
    }

    await CestaVenta.destroy({ where: { usuarioId, cestaId } });

    res.json({ mensaje: `Cesta ${cestaId} eliminada completamente` });
  } catch (error) {
    console.error("Error al eliminar cesta:", error);
    res.status(500).json({ error: "Error interno al eliminar la cesta" });
  }
};

module.exports = {
  agregarACesta,
  obtenerCestaPorUsuario,
  eliminarProductoDeCesta,
  cancelarCesta,
  eliminarCesta,
};
