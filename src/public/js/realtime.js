const socket = io();

// Recibir lista actualizada
socket.on("products", (products) => {
  const productList = document.getElementById("product-list");
  productList.innerHTML = "";

  products.forEach((p) => {
    const li = document.createElement("li");
    li.setAttribute("data-id", p.id);
    li.innerHTML = `
      <strong>${p.title}</strong> - ${p.description} - $${p.price}
      <button class="delete-btn" data-id="${p.id}">Eliminar</button>
    `;
    productList.appendChild(li);
  });

  // Botones eliminar
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      socket.emit("deleteProduct", Number(id));
    });
  });
});

// Form agregar
const form = document.getElementById("product-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const newProduct = {};
  formData.forEach((value, key) => (newProduct[key] = value));

  newProduct.price = Number(newProduct.price);
  newProduct.stock = Number(newProduct.stock);

  socket.emit("newProduct", newProduct);
  form.reset();
});
