const express = require("express");
const router = express.Router();

const { obtenerAuditorias } = require("../controllers/auditoriaController");

const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

// Ruta protegida: solo los administradores pueden ver el historial
router.get("/", verificacionToken, verificacionAdmin, obtenerAuditorias);

module.exports = router;
