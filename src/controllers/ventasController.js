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
    let descuentoCodigo = 0; // 🔹 Variable para manejar el código promocional

    // 🔍 **Si hay un código promocional, obtener el descuento de la BD**
    if (codigo_promocional) {
      const promocionCodigo = await PromocionesDescuentos.findOne({
        where: {
          codigo_promocional,
          estado: "activo",
          fecha_inicio: { [Op.lte]: sequelize.fn("NOW") },
          fecha_fin: { [Op.gte]: sequelize.fn("NOW") },
        },
        transaction,
      });

      if (promocionCodigo) {
        descuentoCodigo = promocionCodigo.valor_descuento;
        console.log(
          `🎯 Código promocional aplicado: ${codigo_promocional}, Descuento: ${descuentoCodigo}`
        );
      } else {
        console.log(
          `⚠️ Código promocional ${codigo_promocional} no válido o vencido.`
        );
      }
    }

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

      const filtroPromocion = {
        estado: "activo",
        fecha_inicio: { [Op.lte]: sequelize.fn("NOW") },
        fecha_fin: { [Op.gte]: sequelize.fn("NOW") },
      };

      if (producto.productoId)
        filtroPromocion[Op.or] = [{ productoId: producto.productoId }];
      if (producto.categoriaId)
        filtroPromocion[Op.or].push({ categoriaId: producto.categoriaId });

      const promocionesDisponibles = await PromocionesDescuentos.findAll({
        where: filtroPromocion,
        transaction,
      });

      console.log("🎯 Promociones encontradas en BD:", promocionesDisponibles);

      // 🔄 **Aplicar descuentos de promociones**
      for (const promocion of promocionesDisponibles) {
        let descuentoPromocion = 0;

        if (promocion.tipo === "porcentaje") {
          descuentoPromocion = precio_final * (promocion.valor_descuento / 100);
        } else if (promocion.tipo === "cantidad_fija") {
          descuentoPromocion = promocion.valor_descuento;
        } else if (
          promocion.tipo === "combo" &&
          producto.cantidad >= promocion.cantidad_minima
        ) {
          descuentoPromocion = promocion.valor_descuento;
        }

        precio_final -= descuentoPromocion;
        descuentoAplicado += descuentoPromocion;

        detallesDescuentos.push({
          producto: producto.nombre,
          promocion: promocion.nombre_promocion,
          tipo: promocion.tipo,
          descuentoAplicado: descuentoPromocion,
          precioFinal: precio_final,
        });
      }

      // 🔄 **Aplicar el descuento del código promocional**
      if (codigo_promocional && descuentoCodigo > 0) {
        console.log(
          `✅ Aplicando código promocional ${codigo_promocional}: Descuento ${descuentoCodigo}`
        );
        precio_final -= descuentoCodigo;
        descuentoAplicado += descuentoCodigo;

        detallesDescuentos.push({
          producto: producto.nombre,
          promocion: `Código Promocional: ${codigo_promocional}`,
          tipo: "codigo",
          descuentoAplicado: descuentoCodigo,
          precioFinal: precio_final,
        });
      }

      subtotal += precio_final * producto.cantidad;
    }

    const IGV = subtotal * 0.18;
    const totalConImpuestos = subtotal + IGV;

    const nuevaVenta = await Venta.create(
      { usuarioId, cestaId, total: totalConImpuestos, fecha: new Date() },
      { transaction }
    );

    console.log("✅ Venta registrada:", nuevaVenta.id);

    await CestaVentas.update(
      { estado: "procesado" },
      { where: { cestaId, usuarioId }, transaction }
    );

    console.log("✅ Cesta actualizada como 'procesado'.");

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
