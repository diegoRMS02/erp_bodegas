const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Crear usuario
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      correo,
      password: passwordEncriptada,
      rol,
    });

    res.status(201).json({ mensaje: "Usuario creado correctamente", usuario });
  } catch (error) {
    res.status(500).json({
      error: "Error al registrar usuario",
      detalle: error.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const esCorrecto = await bcrypt.compare(password, usuario.password);
    if (!esCorrecto) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET || "secreto123",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

//obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Obtener usuarios por ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

// Editar usuario
const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    usuario.nombre = nombre;
    usuario.correo = correo;
    usuario.rol = rol;
    await usuario.save();
    res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

//eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    await usuario.destroy();
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// ✅ Exportar ambas funciones
module.exports = {
  registrarUsuario,
  login,
  obtenerUsuarioPorId,
  obtenerUsuarios,
  editarUsuario,
  eliminarUsuario,
};
