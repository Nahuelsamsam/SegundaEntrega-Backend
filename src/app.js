import express from "express";
import { engine } from "express-handlebars";
import { Server } from "socket.io";
import { createServer } from "http";

import productsRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import ProductManager from "./managers/ProductManager.js";

const app = express();
const httpServer = createServer(app); // servidor http
const io = new Server(httpServer); // socket.io

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./src/public")); // carpeta pública para js del cliente

// Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");

// Manager
const productManager = new ProductManager("./src/data/Products.json");

// Routers API
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

// Router vistas
app.get("/home", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("home", { products });
});

app.get("/realtimeproducts", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("realTimeProducts", { products });
});

// Exponer io
app.set("io", io);

// Eventos socket.io
io.on("connection", async (socket) => {
  console.log("Cliente conectado");

  // enviar lista inicial
  const products = await productManager.getProducts();
  socket.emit("products", products);

  // agregar producto
  socket.on("newProduct", async (data) => {
    await productManager.addProduct(data);
    const updatedProducts = await productManager.getProducts();
    io.emit("products", updatedProducts);
  });

  // eliminar producto
  socket.on("deleteProduct", async (id) => {
    await productManager.deleteProduct(id);
    const updatedProducts = await productManager.getProducts();
    io.emit("products", updatedProducts);
  });
});

const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
