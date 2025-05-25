const express = require("express");
const router = express.Router();
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");
const {
  obtenerAuditoriaCategorias,
} = require("../controllers/auditoriaCategoriaController");

router.get(
  "/",
  verificacionToken,
  verificacionAdmin,
  obtenerAuditoriaCategorias
);
module.exports = router;
