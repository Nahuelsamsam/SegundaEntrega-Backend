import { Router } from "express";
import CartManager from "../managers/CartManager.js";

const router = Router();
const cartManager = new CartManager("./src/data/carts.json");

// GET / - obtener todos los carritos
router.get("/", async (req, res) => {
  const carts = await cartManager.getCarts(); // <-- este método debería existir en tu CartManager
  res.json(carts);
});

// POST / - crear un nuevo carrito
router.post("/", async (req, res) => {
  const newCart = await cartManager.createCart();
  res.status(201).json(newCart);
});

// GET /:cid - obtener carrito por ID
router.get("/:cid", async (req, res) => {
  const cid = Number(req.params.cid);
  if (isNaN(cid)) return res.status(400).json({ error: "ID de carrito inválido" });

  const cart = await cartManager.getCartById(cid);
  if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

  res.json(cart);
});

// POST /:cid/product/:pid - agregar producto a un carrito
router.post("/:cid/product/:pid", async (req, res) => {
  const cid = Number(req.params.cid);
  const pid = Number(req.params.pid);

  if (isNaN(cid) || isNaN(pid)) {
    return res.status(400).json({ error: "ID de carrito o producto inválido" });
  }

  const updatedCart = await cartManager.addProductToCart(cid, pid);
  if (!updatedCart) return res.status(404).json({ error: "Carrito no encontrado" });

  res.json(updatedCart);
});

export default router;
