import fs from "fs";

export default class CartManager {
  constructor(path) {
    this.path = path;
  }

  async getCarts() {
    try {
      if (!fs.existsSync(this.path)) return [];
      const data = await fs.promises.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error al leer los carritos:", error);
      return [];
    }
  }

  async createCart() {
    const carts = await this.getCarts();
    const newId = carts.length > 0 ? carts[carts.length - 1].id + 1 : 1;

    const newCart = { id: newId, products: [] };
    carts.push(newCart);

    try {
      await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
      return newCart;
    } catch (error) {
      console.error("Error al crear el carrito:", error);
      return null;
    }
  }

  async getCartById(id) {
    const carts = await this.getCarts();
    return carts.find((c) => c.id === id) || null;
  }

  async addProductToCart(cid, pid) {
    const carts = await this.getCarts();
    const cartIndex = carts.findIndex((c) => c.id === cid);
    if (cartIndex === -1) return null;

    const cart = carts[cartIndex];
    const productIndex = cart.products.findIndex((p) => p.product === pid);

    if (productIndex !== -1) {
      // 👇 Si ya existe, sumamos cantidad
      cart.products[productIndex].quantity += 1;
    } else {
      // 👇 Si no existe, lo agregamos
      cart.products.push({ product: Number(pid), quantity: 1 });
    }

    carts[cartIndex] = cart;

    try {
      await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
      return cart;
    } catch (error) {
      console.error("Error al agregar producto al carrito:", error);
      return null;
    }
  }
}
