import { Router } from "express";
import Product from "../dao/models/Product.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    let { limit = 10, page = 1, sort, query } = req.query;

    limit = Math.max(parseInt(limit) || 10, 1);
    page = Math.max(parseInt(page) || 1, 1);

    const filter = {};
    if (query) {
      const parts = query.split(":");
      if (parts.length === 2) {
        const [field, value] = parts;
        if (field === "category") filter.category = value;
        else if (field === "status") filter.status = (value === "true" || value === "1");
        else filter[field] = value;
      } else {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } }
        ];
      }
    }

    const options = { page, limit, lean: true };
    if (sort === "asc") options.sort = { price: 1 };
    else if (sort === "desc") options.sort = { price: -1 };

    const result = await Product.paginate(filter, options);

    const buildLink = (targetPage) => {
      const qp = { ...req.query, page: targetPage };
      const base = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
      return `${base}?${new URLSearchParams(qp).toString()}`;
    };

    const responsePayload = {
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
      nextLink: result.hasNextPage ? buildLink(result.nextPage) : null
    };

    const wantsJson =
      req.accepts("json") === "json" || req.query.format === "json" || req.query.api === "true";

    if (wantsJson) {
      return res.json(responsePayload);
    } else {
      return res.render("products", {
        products: result.docs,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        totalPages: result.totalPages,
        prevLink: responsePayload.prevLink,
        nextLink: responsePayload.nextLink,
        currentQuery: req.query
      });
    }
  } catch (err) {
    console.error("GET /products error:", err);
    return res.status(500).send("Error interno del servidor");
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await Product.findById(req.params.pid).lean();
    if (!product) return res.status(404).send("Producto no encontrado");

    return res.render("productDetail", { product });
  } catch (err) {
    console.error("GET /products/:pid error:", err);
    return res.status(500).send("Error interno del servidor");
  }
});

export default router;
