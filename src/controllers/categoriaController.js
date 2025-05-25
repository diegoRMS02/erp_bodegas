const Categoria = require("../models/Categoria");

// Crear una nueva categoría
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Crear la categoría
    const nuevaCategoria = await Categoria.create({ nombre, descripcion });

    return res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    return res.status(200).json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
// Obtener una categoría por ID
const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    return res.status(200).json(categoria);
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
// Actualizar una categoría
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    // Actualizar la categoría
    categoria.nombre = nombre;
    categoria.descripcion = descripcion;
    await categoria.save();
    return res.status(200).json(categoria);
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Eliminar una categoría
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await categoria.update({ eliminado: true }); // Marcar como eliminada
    res.status(200).json({ mensaje: "Categoría eliminada (soft delete)" });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};
// Exportar los controladores
module.exports = {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId,
  actualizarCategoria,
  eliminarCategoria,
};
