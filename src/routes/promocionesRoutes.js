const express = require("express");
const router = express.Router();
const {
  crearPromocion,
  obtenerPromociones,
} = require("../controllers/promocionesController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

//rutas protegidas
router.post("/crear", verificacionToken, verificacionAdmin, crearPromocion);
router.get("/", verificacionToken, verificacionAdmin, obtenerPromociones);

module.exports = router;
