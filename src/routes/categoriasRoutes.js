const expres = require("express");
const router = expres.Router();
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");
//autenticacion
const {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId,
  actualizarCategoria,
  eliminarCategoria,
} = require("../controllers/categoriaController");

// Ruta para crear una nueva categoría (solo admin)
router.post("/crear", verificacionToken, verificacionAdmin, crearCategoria);
// Ruta para obtener todas las categorías (pública)
router.get("/", verificacionToken, obtenerCategorias);

// Ruta para obtener una categoría por ID (pública)
router.get("/:id", verificacionToken, obtenerCategoriaPorId);
// Ruta para actualizar una categoría (solo admin)
router.put("/:id", verificacionToken, verificacionAdmin, actualizarCategoria);
// Ruta para eliminar una categoría (solo admin)
router.delete("/:id", verificacionToken, verificacionAdmin, eliminarCategoria);

module.exports = router;
