import { Router } from "express";
import nodemailer from 'nodemailer';

const router = Router();

router.get('/', (req, res)=>{
    res.render("/index")
})

//----------------------------------------------------------------------------------------------------------------------------------------------

router.post('/send-emails', async (req, res) => {
  try {
    const clientes = Array.isArray(req.body) ? req.body : [req.body];
    const tamanoTanda = 10; // Cantidad de correos a enviar por tanda
    const delay = 1000; // Pausa de 1 segundo (1000 milisegundos)
    const resultadosGenerales = [];

    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: "ventas@en3partes.com",
        pass: "rkgr lvoe mncw mtye" // Consejo: Usa variables de entorno para las credenciales
      }
    });

    // Función para pausar la ejecución
    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Procesamos el array de clientes en tandas
    for (let i = 0; i < clientes.length; i += tamanoTanda) {
      const tanda = clientes.slice(i, i + tamanoTanda);
      console.log(`Procesando tanda de ${tanda.length} correos...`);

      const promesasTanda = tanda.map(cliente => {
        const mailOptions = {
          from: "ventas@en3partes.com",
          to: cliente.Mail,
          subject: "Productos que hablan por tu marca",
          html: `
            <p>Hola ${cliente.Usuario},</p>
            <p>Somos <b>En 3 Partes</b> y trabajamos para que cada acción de marketing se convierta en una experiencia que deje huella. Diseñamos y seleccionamos productos que reflejan la esencia de tu marca, fortalecen su presencia y generan fidelidad en tus clientes y colaboradores.</p>
            <p>Queremos ser tu socio estratégico para impulsar el crecimiento de tu marca con soluciones creativas, personalizadas y de alta calidad.</p>
            <p>📂 Conocé todo lo que podemos hacer por vos: 
              <a href="https://drive.google.com/file/d/1Cdx-eCN4y9T-FWqHF6OOuPDkbLK3-uR1/view?usp=sharing" target="_blank">Ver catálogo</a>
            </p>
            <p>Saludos,<br>En 3 Partes.</p>
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
/*
router.post('/send-emails', async (req, res) => {
  try {
    const clientes = Array.isArray(req.body) ? req.body : [req.body]; // asegura que sea array

    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: "ventas@en3partes.com",
        pass: "rkgr lvoe mncw mtye"
      }
    });

    // Generamos todas las promesas de envío
    const promesas = clientes.map(cliente => {
      const mailOptions = {
        from: "ventas@en3partes.com",
        to: cliente.Mail,
        subject: "Productos que hablan por tu marca",
        html: `
          <p>Hola ${cliente.Usuario},</p>
          <p>Somos <b>En 3 Partes</b> y trabajamos para que cada acción de marketing se convierta en una experiencia que deje huella. Diseñamos y seleccionamos productos que reflejan la esencia de tu marca, fortalecen su presencia y generan fidelidad en tus clientes y colaboradores.</p>
          <p>Queremos ser tu socio estratégico para impulsar el crecimiento de tu marca con soluciones creativas, personalizadas y de alta calidad.</p>
          <p>📂 Conocé todo lo que podemos hacer por vos: 
            <a href="https://drive.google.com/file/d/1hPL2b85tpAwnzGEbe9u0xNywO_8sGqcV/view?usp=sharing" target="_blank">Ver catálogo</a>
          </p>
          <p>Saludos,<br>En 3 Partes.</p>
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

    // Ejecutamos todo en paralelo
    const resultados = await Promise.all(promesas);
    const fecha_de_envio = clientes['fecha de envio'] = new Date().toLocaleString("es-AR")

    console.log("los resultados son", resultados)

    res.json({ status: "finalizado", resultados, fecha_de_envio});

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al enviar correos");
  }
});*/

//'juanpablobonacina15@gmail.com',//
export default router; 