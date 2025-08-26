import { Router } from "express";
import ProductManager from "../managers/ProductManager.js";

const router = Router();
const productManager = new ProductManager("./src/data/products.json");

// GET / - lista todos los productos
router.get("/", async (req, res) => {
  const products = await productManager.getProducts();
  res.json(products);
});

// GET /:pid - obtener producto por id
router.get("/:pid", async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: "ID inválido" });

  const product = await productManager.getProductById(pid);
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

// POST / - agregar un producto nuevo
router.post("/", async (req, res) => {
  const { title, description, code, price, stock, category, thumbnails, status } = req.body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const newProduct = await productManager.addProduct({
    title,
    description,
    code,
    price,
    stock,
    category,
    thumbnails: thumbnails || [],
    status: status !== undefined ? status : true   // 👈 si no mandás nada, queda en true
  });

  res.status(201).json(newProduct);
});

// PUT /:pid - actualizar producto
router.put("/:pid", async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: "ID inválido" });

  const updatedProduct = await productManager.updateProduct(pid, req.body);
  if (!updatedProduct) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(updatedProduct);
});

// DELETE /:pid - eliminar producto
router.delete("/:pid", async (req, res) => {
  const pid = Number(req.params.pid);
  if (isNaN(pid)) return res.status(400).json({ error: "ID inválido" });

  await productManager.deleteProduct(pid);
  res.json({ message: "Producto eliminado" });
});

export default router;
