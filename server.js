import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import routes from './routes/routes.js'
import session from 'express-session';


const app = express();
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


// Middleware

app.use(session({
  secret: '123456',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));



app.use(express.static(path.join(__dirname,"public"),{
   index: false // deshabilita el auto-serve de index.html
}));


app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto " + PORT);
});