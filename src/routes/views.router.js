import { Router } from "express";
import Product from "../dao/models/Product.model.js";
import Cart from "../dao/models/Cart.model.js";

const router = Router();

// 📌 Listado de productos con paginación
router.get("/products", async (req, res) => {
  try {
    const { limit = 6, page = 1, sort, query } = req.query;

    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      lean: true
    };

    if (sort) {
      options.sort = { price: sort === "asc" ? 1 : -1 };
    }

    const filter = query ? { category: query } : {};

    const result = await Product.paginate(filter, options);

    // 👉 buscamos o creamos un carrito por defecto
    let defaultCart = await Cart.findOne();
    if (!defaultCart) {
      defaultCart = await Cart.create({ products: [] });
      console.log("🛒 Carrito por defecto creado:", defaultCart._id);
    }

    res.render("products", {
      products: result.docs,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? `/products?page=${result.prevPage}` : null,
      nextLink: result.hasNextPage ? `/products?page=${result.nextPage}` : null,
      page: result.page,
      totalPages: result.totalPages,
      currentQuery: { limit, sort, query },
      defaultCartId: defaultCart._id.toString() // 👈 lo pasamos a la vista
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// 📌 Detalle de producto
router.get("/products/:pid", async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).lean();
    if (!product) return res.status(404).send("Producto no encontrado");

    let defaultCart = await Cart.findOne();
    if (!defaultCart) {
      defaultCart = await Cart.create({ products: [] });
    }

    res.render("productDetail", { product, defaultCartId: defaultCart._id.toString() });
  } catch (err) {
    res.status(500).send("Error al cargar producto");
  }
});

// 📌 Carrito
router.get("/carts/:cid", async (req, res) => {
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

// 📌 Real Time Products
router.get("/realtimeproducts", async (req, res) => {
  res.render("realTimeProducts", { products: [] });
});

// Redirigir a /products
router.get("/", (req, res) => {
  res.redirect("/products");
});

export default router;
