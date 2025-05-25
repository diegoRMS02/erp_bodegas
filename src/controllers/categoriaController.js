const Categoria = require("../models/Categoria");
const AuditoriaCategoria = require("../models/auditoriaCategoria");
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
    // Registrar creacion
    await AuditoriaCategoria.create({
      usuarioId: req.usuario.id, // Asumiendo que tienes el usuario autenticado
      categoriaId: nuevaCategoria.id,
      accion: "Crear",
      detalles: JSON.stringify({
        nombre: nuevaCategoria.nombre,
        descripcion: nuevaCategoria.descripcion,
      }),
    });

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
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Buscar la categoría en la BD
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Guardar valores anteriores para la auditoría
    const datosAnteriores = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    };

    // Actualizar los valores
    await categoria.update({ nombre, descripcion });

    // Registrar auditoría con los cambios antes y después
    await AuditoriaCategoria.create({
      usuarioId: req.usuario.id,
      categoriaId: categoria.id,
      accion: "Actualizar",
      detalles: JSON.stringify({
        antes: datosAnteriores,
        despues: { nombre, descripcion },
      }),
    });

    return res.status(200).json({
      mensaje: "Categoría actualizada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor", detalle: error.message });
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
    // Registrar auditoría de eliminación
    await AuditoriaCategoria.create({
      usuarioId: req.usuario.id,
      categoriaId: categoria.id,
      accion: "Eliminar",
      detalles: JSON.stringify({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
      }),
    });

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
