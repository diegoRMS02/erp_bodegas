const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

// 🔹 Función para generar el PDF
async function generarPdfComprobante(datosComprobante) {
  const browser = await puppeteer.launch(); // 🚀 Se abre un navegador virtual sin interfaz
  const page = await browser.newPage(); // 🌍 Se abre una nueva página en el navegador

  // 🔹 Leer y procesar la plantilla Handlebars
  const templatePath = path.join(__dirname, "../views/comprobanteTemplate.hbs");
  const templateHtml = fs.readFileSync(templatePath, "utf8"); // 📥 Carga el archivo de plantilla
  const template = handlebars.compile(templateHtml); // 📜 Compila la plantilla con Handlebars
  const htmlGenerado = template(datosComprobante); // 🛠️ Rellena la plantilla con los datos

  // 🔹 Cargar el HTML en Puppeteer
  await page.setContent(htmlGenerado); // 🎨 Le damos la estructura HTML generada a la página

  // 🔹 Ruta de almacenamiento del PDF
  const pdfPath = path.join(
    __dirname,
    "../public/pdfs/comprobante_" + datosComprobante.numero + ".pdf"
  );

  // 🔹 Generar y guardar el PDF
  await page.pdf({ path: pdfPath, format: "A4" }); // 🖨️ Convierte la página en PDF y lo guarda

  await browser.close(); // 🔄 Cierra el navegador virtual

  return pdfPath; // 🏁 Devuelve la ruta donde se guardó el PDF
}

module.exports = generarPdfComprobante;
