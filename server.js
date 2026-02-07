import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import routes from './public/routes/routes.js'

const app = express();
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,"public")));

app.use(routes);

app.listen(3000, ()=>console.log("Servidor en http://localhost:3000"));