// src/app.js
import express from "express";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import methodOverride from "method-override";
import { fileURLToPath } from "url";
import { dirname } from "path";

import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";
import ProductManager from "./managers/ProductManager.js";

// 👉 Importar modelo de carrito
import Cart from "./dao/models/Cart.model.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Paths absolutos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

// Handlebars
app.engine("handlebars", engine({
  defaultLayout: "main",
  layoutsDir: __dirname + "/views/layouts",
  helpers: { eq: (a, b) => a === b }
}));
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

// Manager (para realtime con JSON)
const productManager = new ProductManager(__dirname + "/data/Products.json");

// Routers
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);

// Redirección home
app.get("/", (req, res) => res.redirect("/products"));

// Exponer io
app.set("io", io);

// SOCKETS realtime
io.on("connection", async (socket) => {
  console.log("Cliente conectado");

  const products = await productManager.getProducts();
  socket.emit("products", products);

  socket.on("newProduct", async (data) => {
    await productManager.addProduct(data);
    io.emit("products", await productManager.getProducts());
  });

  socket.on("deleteProduct", async (id) => {
    await productManager.deleteProduct(id);
    io.emit("products", await productManager.getProducts());
  });
});

// MongoDB
const MONGO_URL = "mongodb://localhost:27017/ecommerce";
mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log("✅ Conectado a MongoDB");

    // 👉 Crear carrito por defecto si no existe
    let defaultCart = await Cart.findOne();
    if (!defaultCart) {
      defaultCart = await Cart.create({ products: [] });
      console.log("🛒 Carrito por defecto creado:", defaultCart._id);
    } else {
      console.log("🛒 Carrito por defecto encontrado:", defaultCart._id);
    }

    // 👉 Guardamos el ID en app.locals (disponible en todas las vistas)
    app.locals.defaultCartId = defaultCart._id.toString();
  })
  .catch(err => console.error("❌ Error en MongoDB:", err));

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
