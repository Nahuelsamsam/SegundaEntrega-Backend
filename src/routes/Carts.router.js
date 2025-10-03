import { Router } from "express";
import Cart from "../dao/models/Cart.model.js";
import Product from "../dao/models/Product.model.js";

const router = Router();

// 📌 Ver carrito
router.get("/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid)
      .populate("products.product")
      .lean();

    if (!cart) return res.status(404).send("Carrito no encontrado");

    res.render("cart", { cart });
  } catch (err) {
    res.status(500).send("Error al cargar carrito");
  }
});

// 📌 Agregar producto al carrito con cantidad seleccionada
router.post("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const { quantity } = req.body; // 👈 cantidad desde el form
    const qty = parseInt(quantity) || 1;

    const product = await Product.findById(pid);
    if (!product) return res.status(404).send("Producto no encontrado");

    if (product.stock < qty) {
      return res.status(400).send("No hay stock suficiente");
    }

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).send("Carrito no encontrado");

    const item = cart.products.find(p => p.product.toString() === pid);
    if (item) {
      item.quantity += qty;
    } else {
      cart.products.push({ product: pid, quantity: qty });
    }

    // descontar stock
    product.stock -= qty;

    await cart.save();
    await product.save();

    res.redirect(`/carts/${cid}`);
  } catch (err) {
    console.error("Error al agregar producto al carrito:", err);
    res.status(500).send("Error interno del servidor");
  }
});

// 📌 Eliminar producto del carrito y devolver stock
router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).send("Carrito no encontrado");

    const itemIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (itemIndex === -1) return res.status(404).send("Producto no está en el carrito");

    const qty = cart.products[itemIndex].quantity;
    cart.products.splice(itemIndex, 1);
    await cart.save();

    const product = await Product.findById(pid);
    if (product) {
      product.stock += qty;
      await product.save();
    }

    res.redirect(`/carts/${cid}`);
  } catch (err) {
    console.error("Error al eliminar producto del carrito:", err);
    res.status(500).send("Error interno del servidor");
  }
});

export default router;
