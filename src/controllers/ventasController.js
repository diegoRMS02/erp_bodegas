const Venta = require("../models/Venta");
const CestaVentas = require("../models/cestaVentas");
const Producto = require("../models/Producto");
const PromocionesDescuentos = require("../models/promocionesDescuentos");
const VentasDescuentos = require("../models/ventasDescuentos");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

const confirmarVenta = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { usuarioId, cestaId, codigo_promocional } = req.body;
    console.log("📌 Iniciando confirmación de venta", {
      usuarioId,
      cestaId,
      codigo_promocional,
    });

    // 🔄 **Obtener la cesta de la BD**
    const cesta = await CestaVentas.findOne({
      where: { cestaId, usuarioId, estado: "pendiente" },
      attributes: ["productos"],
      raw: true,
      transaction,
    });

    console.log("📌 Cesta obtenida desde BD:", cesta);

    if (!cesta || !cesta.productos) {
      await transaction.rollback();
      console.error(
        "❌ Error: La cesta no se obtuvo correctamente desde la BD."
      );
      return res
        .status(400)
        .json({
          error: "Error al obtener la cesta, no se puede confirmar la venta.",
        });
    }

    // 🔄 **Extraer los productos correctamente**
    let productosCesta;
    try {
      productosCesta =
        typeof cesta.productos === "string"
          ? JSON.parse(cesta.productos)
          : cesta.productos;
    } catch (error) {
      console.error("❌ Error al procesar los productos en la venta:", error);
      await transaction.rollback();
      return res
        .status(500)
        .json({ error: "Error al procesar los productos en la venta." });
    }

    console.log("✅ Productos extraídos desde la cesta:", productosCesta);

    let subtotal = 0;
    let detallesDescuentos = [];

    // 🔄 **Procesar cada producto y aplicar descuentos**
    for (const producto of productosCesta) {
      console.log("🛒 Producto procesado:", producto);

      let stockDisponible = await Producto.findOne({
        where: { id: producto.productoId },
        attributes: ["stock"],
        raw: true,
        transaction,
      });

      console.log("📦 Stock disponible:", stockDisponible);

      if (!stockDisponible || stockDisponible.stock < producto.cantidad) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${
            producto.nombre
          }. Disponible: ${stockDisponible?.stock || 0}, solicitado: ${
            producto.cantidad
          }`,
        });
      }

      let precio_final = producto.precio;
      let descuentoAplicado = 0;

      // 🔍 **Verificar promociones activas en la BD**
      console.log(
        "🛠 Buscando promociones activas para:",
        producto.nombre,
        "ID:",
        producto.productoId
      );

      const hoy = new Date();
      const filtroPromocion = {
        estado: "activo",
        fecha_inicio: { [Op.lte]: sequelize.fn("NOW") },
        fecha_fin: { [Op.gte]: sequelize.fn("NOW") },
      };

      // 🔹 **Corrección:** Agregamos detección de `codigo_promocional`
      if (codigo_promocional) {
        filtroPromocion.codigo_promocional = codigo_promocional; // 🔹 Se busca por código promocional
      } else {
        if (producto.productoId)
          filtroPromocion[Op.or] = [{ productoId: producto.productoId }];
        if (producto.categoriaId)
          filtroPromocion[Op.or].push({ categoriaId: producto.categoriaId });
      }

      const promocionesDisponibles = await PromocionesDescuentos.findAll({
        where: filtroPromocion,
        transaction,
      });

      console.log("🎯 Promociones encontradas en BD:", promocionesDisponibles);

      // 🔄 **Aplicar descuento si hay promociones**
      if (promocionesDisponibles.length > 0) {
        for (const promocion of promocionesDisponibles) {
          if (promocion.tipo === "porcentaje") {
            descuentoAplicado +=
              precio_final * (promocion.valor_descuento / 100);
          } else if (promocion.tipo === "cantidad_fija") {
            descuentoAplicado += promocion.valor_descuento;
          } else if (
            promocion.tipo === "combo" &&
            producto.cantidad >= promocion.cantidad_minima
          ) {
            descuentoAplicado += promocion.valor_descuento;
          }

          await VentasDescuentos.create(
            {
              ventaId: cestaId,
              promocionId: promocion.id,
              tipo: promocion.tipo,
              valor_descuento: promocion.valor_descuento,
              precio_final: precio_final - descuentoAplicado,
            },
            { transaction }
          );

          detallesDescuentos.push({
            producto: producto.nombre,
            promocion: promocion.nombre_promocion,
            tipo: promocion.tipo,
            descuentoAplicado,
            precioFinal: precio_final - descuentoAplicado,
          });
        }
      }

      // 🔄 **Actualizar precio final con descuentos aplicados**
      precio_final -= descuentoAplicado;
      subtotal += precio_final * producto.cantidad;

      // 🔄 **Reducir stock después de la venta**
      await Producto.update(
        { stock: stockDisponible.stock - producto.cantidad },
        { where: { id: producto.productoId }, transaction }
      );
    }

    // 🔍 **Calcular IGV (18%) y actualizar total**
    const IGV = subtotal * 0.18;
    const totalConImpuestos = subtotal + IGV;

    // 🔄 **Registrar la venta oficialmente**
    const nuevaVenta = await Venta.create(
      {
        usuarioId,
        cestaId,
        total: totalConImpuestos,
        fecha: new Date(),
      },
      { transaction }
    );

    console.log("✅ Venta registrada:", nuevaVenta.id);

    await transaction.commit();

    res.status(201).json({
      mensaje: "Venta confirmada correctamente con descuentos aplicados.",
      ventaId: nuevaVenta.id,
      subtotal,
      descuentos: detallesDescuentos,
      IGV,
      totalFinal: totalConImpuestos,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("🚨 Error al confirmar venta:", error);
    res.status(500).json({ error: "Error interno al confirmar venta." });
  }
};

module.exports = { confirmarVenta };
