const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

// Middleware para verificar que el token JWT sea válido
const verificacionToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar al usuario completo en la base de datos
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }

    req.usuario = usuario; // Ahora tendrás acceso a req.usuario.id, .rol, .nombre, etc.
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token no válido" });
  }
};

// Middleware para permitir solo a usuarios con rol "admin"
const verificacionAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== "admin") {
    return res
      .status(403)
      .json({ mensaje: "No tienes permisos para realizar esta acción" });
  }
  next();
};

// Middleware para permitir solo a usuarios con rol "vendedor"
const verificacionVendedor = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== "vendedor") {
    return res
      .status(403)
      .json({ mensaje: "Acceso restringido solo para vendedores" });
  }
  next();
};

module.exports = {
  verificacionToken,
  verificacionAdmin,
  verificacionVendedor,
};
