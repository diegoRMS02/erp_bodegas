const Producto = require("../models/Producto"); //importamos el modelo
const auditoriaProducto = require("../models/auditoriaProducto");

const crearProducto = async (req, res) => {
  try {
    categoriaPermitidas = ["fruta", "verdura", "lacteo", "carne", "otros"]; //categorias permitidas
    // Validación de autenticación
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { nombre, descripcion, stock, precio, fecha_vencimiento, categoria } =
      req.body;

    // Validaciones de campos obligatorios
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    if (precio == null) {
      return res.status(400).json({ error: "El precio es obligatorio" });
    }
    if (stock == null) {
      return res.status(400).json({ error: "El stock es obligatorio" });
    }
    if (!fecha_vencimiento) {
      return res
        .status(400)
        .json({ error: "La fecha de vencimiento es obligatoria" });
    }
    if (categoria && !categoriaPermitidas.includes(categoria)) {
      return res.status(400).json({ error: "Categoría no válida" });
    }
    // Crear el producto
    const producto = await Producto.create({
      nombre,
      descripcion,
      stock,
      precio,
      fecha_vencimiento,
      categoria,
    });

    // Registrar en auditoría
    await auditoriaProducto.create({
      usuarioId: req.usuario.id,
      productoId: producto.id,
      accion: "Crear",
      detalles: `Producto creado: ${JSON.stringify(req.body)}`,
    });

    res.status(201).json(producto);
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({
      error: "Error al crear el producto",
      detalle: error.message,
    });
  }
};

module.exports = { crearProducto };

//Obtener los productos todos

const obtenerProductos = async (req, res) => {
  try {
    const { categoria } = req.query;
    const where = { eliminado: false };

    if (categoria) where.categoria = categoria;

    const productos = await Producto.findAll({ where });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
};

//obtener producto por ID

const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el id del producto desde los parámetros de la ruta

    // Buscar el producto por id y que además no esté marcado como eliminado (soft delete)
    const producto = await Producto.findOne({
      where: {
        id,
        eliminado: false, // solo productos activos
      },
    });

    if (!producto) {
      // Si no existe o está eliminado, enviamos error 404
      res.status(404).json({ error: "Producto no encontrado" });
    } else {
      // Si se encontró el producto activo, lo devolvemos en formato JSON
      res.json(producto);
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

//Actualizar producto

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar el producto
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 2. Actualizarlo
    await producto.update(req.body);

    // 3. Auditar
    await auditoriaProducto.create({
      usuarioId: req.usuario.id,
      productoId: producto.id,
      accion: "actualizar",
      detalles: `Producto editado: ${JSON.stringify(req.body)}`,
    });

    // 4. Responder
    res.json({ mensaje: "Producto actualizado correctamente" });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar el producto",
      detalle: error.message,
    });
  }
};

//Eliminar producto

const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscamos el producto
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Actualizamos el campo eliminado a true (soft delete)
    producto.eliminado = true;
    await producto.save();

    // Guardar auditoría indicando borrado
    await auditoriaProducto.create({
      usuarioId: req.usuario.id, // id del usuario que borra
      productoId: producto.id,
      accion: "borrado",
      detalles: JSON.stringify(producto), // guardamos el estado completo del producto antes del borrado
    });

    res.json({ mensaje: "Producto eliminado (soft delete) correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};

// exportamos los modelos

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
