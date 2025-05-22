const express = require("express");
const router = express.Router();
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

const {
  registrarUsuario,
  login,
  obtenerUsuarios,
} = require("../controllers/usuarioController");

// Ruta para registrar usuario (luego la protegemos solo para admin)
//router.post("/registro", registrarUsuario);
// Ruta para login
//router.post("/login", login);
//router.get("/", obtenerUsuarios);

// ✅ Ruta protegida: solo un ADMIN puede registrar nuevos usuarios
router.post(
  "/registro",
  verificacionToken,
  verificacionAdmin,
  registrarUsuario
);

// Ruta pública para login
router.post("/login", login);

// ✅ Ruta protegida: solo un ADMIN puede ver todos los usuarios
router.get("/", verificacionToken, verificacionAdmin, obtenerUsuarios);

module.exports = router;
