const express = require("express");
const router = express.Router();
const { agregarACesta } = require("../controllers/cestaVentasController");
const {
  verificacionToken,
  verificacionAdmin,
} = require("../middleware/authMiddleware");

router.post("/cesta", verificacionToken, verificacionAdmin, agregarACesta);

module.exports = router;
