import 'dotenv/config';
import { Router } from "express";
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Middleware de autenticación ───────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    next();
  } else {
    res.redirect('/login');
  }
}
 
// ── Rutas de login ────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  res.redirect('/login.html');
});
 
  const LOGIN_USER = process.env.LOGIN_USER;
  const LOGIN_PASS = process.env.LOGIN_PASS;

router.post('/api/login', (req, res) => {
  const { email, password } = req.body;
    console.log("EMAIL recibido:  |" + email + "|");
    console.log("PASS recibida:   |" + password + "|");
    console.log("EMAIL del env:   |" + process.env.LOGIN_USER + "|");
    console.log("PASS del env:    |" + process.env.LOGIN_PASS + "|");
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }
 
  // TODO: reemplazá con tu validación real (base de datos, etc.)
  const isValid = email == LOGIN_USER && password == LOGIN_PASS;
 
  if (!isValid) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
 
  req.session.usuario = { email };
  return res.status(200).json({ redirect: '/index.html' });
});
 
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});
 
// ── Rutas protegidas ──────────────────────────────────────────────────────────
router.get('/', requireLogin, (req, res) => {
  res.redirect('/index.html');
});
 
router.get('/index.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});



const GMAIL_USER = process.env.GMAIL_USER;       
const GMAIL_PASS = process.env.GMAIL_PASS;  


console.log("Revisando configuración...");
console.log("USER-G:", GMAIL_USER ? "Cargado ✅" : "VACÍO ❌");
console.log("PASS-G:", GMAIL_PASS ? "Cargado ✅" : "VACÍO ❌");


router.post('/send-emails', async (req, res) => {
  try {
    const clientes = Array.isArray(req.body) ? req.body : [req.body];
    const tamanoTanda = 10; // Cantidad de correos a enviar por tanda
    const delay = 1000; // Pausa de 1 segundo (1000 milisegundos)
    const resultadosGenerales = [];

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS // Consejo: Usa variables de entorno para las credenciales
      },
      pool: true, // Muy importante para enviar tandas (mantiene la conexión abierta)
      connectionTimeout: 30000, // 30 segundos de margen
      greetingTimeout: 30000,
      socketTimeout: 30000,
      tls: {
        // Esto evita que la conexión se caiga por problemas de certificados en el servidor de Render
        rejectUnauthorized: false
      }
    });

    console.log("Revisando configuración...");
    console.log("USER:", GMAIL_USER ? "Cargado ✅" : "VACÍO ❌");
    console.log("PASS:", GMAIL_PASS ? "Cargado ✅" : "VACÍO ❌");

    // Función para pausar la ejecución
    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Procesamos el array de clientes en tandas
    for (let i = 0; i < clientes.length; i += tamanoTanda) {
      const tanda = clientes.slice(i, i + tamanoTanda);
      console.log(`Procesando tanda de ${tanda.length} correos...`);

      const promesasTanda = tanda.map(cliente => {
        const mailOptions = {
          from: GMAIL_USER,
          to: cliente.Mail,
          subject: "Soluciones en merchandising e indumentaria corporativa - EN3PARTES SRL",
          html: `
            <p>Estimado/a ${cliente.Usuario},</p>
            <p>Somos <b>En 3 Partes</b> yproveemos merchandising corporativo para marcas líderes. .</p>
            <p>Colaboramos estrechamente con los equipos de Marketing, RRHH y Compras, brindando un soporte integral para que cada producto refleje con precisión la identidad de su marca.</p>
            <p>Los invito a revisar nuestro catálogo adjunto para evaluar nuestra propuesta y variedad de soluciones de cara a sus futuras campañas:
              <a href="https://drive.google.com/file/d/19LUfRA_SoGRSywe2_hEq1GS4cYqwiYjM/view?usp=sharing" target="_blank">Ver catálogo</a>
            </p>
            <p>Estamos a disposición para armar presupuestos a medida o responder cualquier inquietud.</p>
            <p>Atentamente,</p>
            <p>Equipo de Ventas |<br>En 3 Partes SRL. 📱 11 3144-3539</p>
          `
        };

        return transporter.sendMail(mailOptions)
          .then(() => {
            console.log(`✔ Mail enviado a: ${cliente.Mail}`);
            return { mail: cliente.Mail, status: "ok" };
          })
          .catch(err => {
            console.error(`❌ Error con ${cliente.Mail}:`, err.message);
            return { mail: cliente.Mail, status: "error", error: err.message };
          });
      });

      // Ejecutamos la tanda actual en paralelo
      const resultadosTanda = await Promise.all(promesasTanda);
      resultadosGenerales.push(...resultadosTanda); // Agregamos los resultados de esta tanda al total

      // Si no es la última tanda, esperamos 1 segundo
      if (i + tamanoTanda < clientes.length) {
        console.log(`--- Tanda finalizada. Esperando ${delay / 1000} segundo(s)... ---`);
        await esperar(delay);
      }
    }

    const fecha_de_envio = new Date().toLocaleString("es-AR");
    console.log("Proceso finalizado. Los resultados totales son:", resultadosGenerales);

    res.json({ status: "finalizado", resultados: resultadosGenerales, fecha_de_envio });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al procesar el envío de correos");
  }
});

///---------------------------------------------------------------------------------------------------------------------------------------------

export default router; 