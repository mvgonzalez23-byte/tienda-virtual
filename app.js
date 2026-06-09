let listadoProductosGlobal = [];
let carrito = [];
let historialVentasGlobal = [];
let usuarioSesionActiva = null;

// Inicializador estructural del sistema central
document.addEventListener("DOMContentLoaded", () => {
    inicializarTemas();
    cargarBaseDatosLocal();
    inicializarEstadoConexion();
    renderizarSeccionInicio();
    verificarSesionActiva();
    
    // Configuración del manejador de formularios
    document.getElementById("login-form").addEventListener("submit", ejecutarLogin);
    document.getElementById("register-form").addEventListener("submit", ejecutarRegistro);
    document.getElementById("profile-edit-form").addEventListener("submit", actualizarDatosPerfil);
    document.getElementById("product-crud-form").addEventListener("submit", procesarFormularioCRUD);
    document.getElementById("checkout-form").addEventListener("submit", procesarCompraCarrito);
});

/* ==========================================================================
   PERSISTENCIA DE DATOS (LOCALSTORAGE Y SESSIONSTORAGE)
   ========================================================================== */
function cargarBaseDatosLocal() {
    const productosLocales = localStorage.getItem("ucab_productos");
    if (!productosLocales) {
        localStorage.setItem("ucab_productos", JSON.stringify(productosDestacados));
        listadoProductosGlobal = [...productosDestacados];
    } else {
        listadoProductosGlobal = JSON.parse(productosLocales);
    }

    const ventasLocales = localStorage.getItem("ucab_ventas");
    if (!ventasLocales) {
        const ventaSemilla = [{
            idPedido: "PED-10024",
            clienteNombre: "Carlos Pérez",
            clienteEmail: "carlos@ucab.edu.ve",
            direccion: "Caracas, Venezuela",
            productos: [{ id: 1, titulo: "Laptop Ultrawide Pro", cantidad: 1, precio: 1200.00 }],
            total: 1392.00,
            estadoEnvio: "Pendiente"
        }];
        localStorage.setItem("ucab_ventas", JSON.stringify(ventaSemilla));
        historialVentasGlobal = ventaSemilla;
    } else {
        historialVentasGlobal = JSON.parse(ventasLocales);
    }
}

function actualizarLocalStorageProductos() {
    localStorage.setItem("ucab_productos", JSON.stringify(listadoProductosGlobal));
}

function actualizarLocalStorageVentas() {
    localStorage.setItem("ucab_ventas", JSON.stringify(historialVentasGlobal));
}

/* ==========================================================================
   SISTEMA DE RUTEO SIMPLE (SPA)
   ========================================================================== */
function navegarA(idSeccion) {
    const secciones = ["inicio-section", "auth-section", "catalogo-section", "carrito-section", "admin-section"];
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden-element");
    });

    const seccionActiva = document.getElementById(`${idSeccion}-section`);
    if (seccionActiva) seccionActiva.classList.remove("hidden-element");

    if (idSeccion === 'catalogo') renderizarCatalogoProductos();
    if (idSeccion === 'carrito') renderizarCarritoCompras();
    if (idSeccion === 'admin') renderizarPanelAdmin();
}

/* ==========================================================================
   MÓDULO 1: RENDERIZADO DE ELEMENTOS EN INICIO
   ========================================================================== */
function renderizarSeccionInicio() {
    const container = document.getElementById("productos-destacados-container");
    if (!container) return;
    container.innerHTML = "";

    const destacados = listadoProductosGlobal.slice(0, 3);
    destacados.forEach(prod => {
        const card = crearTarjetaProductoHtml(prod, true);
        container.appendChild(card);
    });
}

/* ==========================================================================
   MÓDULO 2: AUTENTICACIÓN, ROLES Y PERFILES
   ========================================================================== */
function cambiarTabAuth(tipo) {
    const formLogin = document.getElementById("login-form");
    const formReg = document.getElementById("register-form");
    const tabL = document.getElementById("tab-login");
    const tabR = document.getElementById("tab-register");

    if (tipo === 'login') {
        formLogin.classList.remove("hidden-element");
        formReg.classList.add("hidden-element");
        tabL.classList.add("active");
        tabR.classList.remove("active");
    } else {
        formLogin.classList.add("hidden-element");
        formReg.classList.remove("hidden-element");
        tabL.classList.remove("active");
        tabR.classList.add("active");
    }
}

function ejecutarRegistro(e) {
    e.preventDefault();
    const nombre = document.getElementById("reg-name").value.trim();
    const correo = document.getElementById("reg-email").value.trim();
    const clave = document.getElementById("reg-pass").value;
    const rol = document.getElementById("reg-role").value;

    if (clave.length < 6) {
        alert("❌ La contraseña debe poseer al menos 6 caracteres.");
        return;
    }

    const emailKey = `user_${correo}`;
    if (localStorage.getItem(emailKey)) {
        alert("❌ Este correo ya se encuentra registrado.");
        return;
    }

    const nuevoUsuario = { nombre, correo, clave, rol, avatar: "", direccion: "" };
    localStorage.setItem(emailKey, JSON.stringify(nuevoUsuario));
    alert("🎉 ¡Registro completado de manera exitosa! Ya puedes iniciar sesión.");
    document.getElementById("register-form").reset();
    cambiarTabAuth('login');
}

function ejecutarLogin(e) {
    e.preventDefault();
    const correo = document.getElementById("login-email").value.trim();
    const clave = document.getElementById("login-pass").value;

    const emailKey = `user_${correo}`;
    const datosUser = localStorage.getItem(emailKey);

    if (!datosUser) {
        alert("❌ El usuario ingresado no existe en los registros.");
        return;
    }

    const usuario = JSON.parse(datosUser);
    if (usuario.clave !== clave) {
        alert("❌ Contraseña incorrecta.");
        return;
    }

    sessionStorage.setItem("activeSession", JSON.stringify(usuario));
    alert(`👋 ¡Bienvenido de nuevo, ${usuario.nombre}!`);
    document.getElementById("login-form").reset();
    verificarSesionActiva();
    navegarA('inicio');
}

function verificarSesionActiva() {
    const sesion = sessionStorage.getItem("activeSession");
    const zoneUser = document.getElementById("nav-user-zone");
    const tabCart = document.getElementById("nav-cart-tab");

    if (sesion) {
        usuarioSesionActiva = JSON.parse(sesion);
        zoneUser.innerHTML = `<span class="nav-username">👤 ${usuarioSesionActiva.nombre} (${usuarioSesionActiva.rol})</span>`;
        
        if (usuarioSesionActiva.rol === "Administrador") {
            tabCart.classList.add("hidden-element");
            if (!document.getElementById("nav-admin-tab")) {
                const btnAdmin = document.createElement("button");
                btnAdmin.id = "nav-admin-tab";
                btnAdmin.textContent = "⚙️ Panel Admin";
                btnAdmin.onclick = () => navegarA('admin');
                document.querySelector(".nav-menu").appendChild(btnAdmin);
            }
        } else {
            tabCart.classList.remove("hidden-element");
            const btnAdmin = document.getElementById("nav-admin-tab");
            if (btnAdmin) btnAdmin.remove();
        }
    } else {
        usuarioSesionActiva = null;
        zoneUser.innerHTML = `<span class="nav-username" onclick="mostrarSeccionPerfil()">🔑 Iniciar Sesión / Registro</span>`;
        tabCart.classList.remove("hidden-element"); // Permitir ver el carrito a invitados
        const btnAdmin = document.getElementById("nav-admin-tab");
        if (btnAdmin) btnAdmin.remove();
    }
}

function mostrarSeccionPerfil() {
    navegarA('auth');
    const containerAuth = document.getElementById("auth-forms-container");
    const panelPerfil = document.getElementById("user-profile-panel");

    if (usuarioSesionActiva) {
        containerAuth.classList.add("hidden-element");
        panelPerfil.classList.remove("hidden-element");

        document.getElementById("profile-display-name").textContent = usuarioSesionActiva.nombre;
        document.getElementById("profile-display-role").textContent = usuarioSesionActiva.rol;
        document.getElementById("profile-display-avatar").src = usuarioSesionActiva.avatar || "https://picsum.photos/100/100?random=99";

        const camposCliente = document.querySelectorAll(".field-cliente-only");
        camposCliente.forEach(el => {
            if (usuarioSesionActiva.rol === "Administrador") el.classList.add("hidden-element");
            else el.classList.remove("hidden-element");
        });

        document.getElementById("profile-avatar-url").value = usuarioSesionActiva.avatar || "";
        document.getElementById("profile-address").value = usuarioSesionActiva.direccion || "";
    } else {
        containerAuth.classList.remove("hidden-element");
        panelPerfil.classList.add("hidden-element");
        cambiarTabAuth('login');
    }
}

function actualizarDatosPerfil(e) {
    e.preventDefault();
    if (!usuarioSesionActiva) return;

    const nuevaClave = document.getElementById("profile-new-pass").value;
    const emailKey = `user_${usuarioSesionActiva.correo}`;

    if (nuevaClave.trim() !== "") {
        usuarioSesionActiva.clave = nuevaClave;
    }

    if (usuarioSesionActiva.rol === "Cliente") {
        usuarioSesionActiva.avatar = document.getElementById("profile-avatar-url").value.trim();
        usuarioSesionActiva.direccion = document.getElementById("profile-address").value.trim();
    }

    localStorage.setItem(emailKey, JSON.stringify(usuarioSesionActiva));
    sessionStorage.setItem("activeSession", JSON.stringify(usuarioSesionActiva));

    alert("🎉 Configuración guardada correctamente.");
    document.getElementById("profile-new-pass").value = "";
    mostrarSeccionPerfil();
    verificarSesionActiva();
}

function cerrarSesion() {
    sessionStorage.removeItem("activeSession");
    usuarioSesionActiva = null;
    alert("Sesión finalizada.");
    verificarSesionActiva();
    navegarA('inicio');
}

function recuperarContrasena() {
    const correo = prompt("Por favor, introduce tu correo institucional registrado:");
    if (!correo) return;
    
    const datos = localStorage.getItem(`user_${correo.trim()}`);
    if (!datos) {
        alert("❌ El correo ingresado no coincide con ninguna cuenta activa.");
    } else {
        const user = JSON.parse(datos);
        alert(`🔑 [Simulación Recuperación] Tu clave actual es: ${user.clave}`);
    }
}

/* ==========================================================================
   MÓDULO 3: CATÁLOGO Y OPERACIONES DEL CARRITO DE COMPRAS
   ========================================================================== */
function renderizarCatalogoProductos() {
    const grid = document.getElementById("catalogo-productos-grid");
    if (!grid) return;
    grid.innerHTML = "";

    listadoProductosGlobal.forEach(prod => {
        const card = crearTarjetaProductoHtml(prod, false);
        grid.appendChild(card);
    });
}

function crearTarjetaProductoHtml(prod, esLanding = false) {
    const card = document.createElement("div");
    card.className = "producto-card";

    let estrellasHtml = "⭐⭐⭐⭐★";
    if (prod.reseñas && prod.reseñas.length > 0) {
        const suma = prod.reseñas.reduce((acc, r) => acc + r.estrellas, 0);
        const prom = Math.round(suma / prod.reseñas.length);
        estrellasHtml = "⭐".repeat(prom);
    }

    card.innerHTML = `
        <img src="${prod.imagen}" alt="${prod.titulo}">
        <div class="producto-info">
            <span class="badge-categoria">${prod.categoria}</span>
            <h4 style="font-size:1.1rem; font-weight:700;">${prod.titulo}</h4>
            <div style="font-size:0.85rem; color:orange;">${estrellasHtml} (${prod.reseñas ? prod.reseñas.length : 0})</div>
            <div class="precio-tag">$${prod.precio.toFixed(2)}</div>
            <div class="actions-area" style="margin-top:auto; display:flex; flex-direction:column; gap:8px;"></div>
        </div>
    `;

    const actionsArea = card.querySelector(".actions-area");

    if (usuarioSesionActiva && usuarioSesionActiva.rol === "Administrador") {
        if (!esLanding) {
            const btnEditar = document.createElement("button");
            btnEditar.className = "btn-primary";
            btnEditar.textContent = "✏️ Editar Atributos";
            btnEditar.onclick = () => cargarProductoEnFormularioCRUD(prod.id);
            
            const btnEliminar = document.createElement("button");
            btnEliminar.className = "btn-danger";
            btnEliminar.textContent = "🗑️ Eliminar Ítem";
            btnEliminar.onclick = () => eliminarProductoDeInventario(prod.id);

            actionsArea.appendChild(btnEditar);
            actionsArea.appendChild(btnEliminar);
        }
    } else {
        const btnAgregar = document.createElement("button");
        btnAgregar.className = "btn-success";
        btnAgregar.textContent = "🛒 Añadir al Carrito";
        btnAgregar.onclick = () => agregarAlCarrito(prod.id);
        actionsArea.appendChild(btnAgregar);

        if (!esLanding) {
            const btnClonar = document.createElement("button");
            btnClonar.className = "btn-theme";
            btnClonar.style.fontSize = "0.8rem";
            btnClonar.textContent = "👥 Clonar Selección";
            btnClonar.onclick = () => { 
                agregarAlCarrito(prod.id); 
                agregarAlCarrito(prod.id); 
                alert("¡Ítem clonado x2 en el carrito!"); 
            };
            actionsArea.appendChild(btnClonar);
        }
    }

    if (!esLanding && (!usuarioSesionActiva || usuarioSesionActiva.rol === "Cliente")) {
        const areaReseña = document.createElement("div");
        areaReseña.style.borderTop = "1px solid var(--border-color)";
        areaReseña.style.paddingTop = "10px";
        areaReseña.style.marginTop = "5px";
        areaReseña.innerHTML = `
            <select class="select-stars" style="padding:4px; font-size:0.8rem;">
                <option value="5">5 ⭐</option>
                <option value="4">4 ⭐</option>
                <option value="3">3 ⭐</option>
                <option value="2">2 ⭐</option>
                <option value="1">1 ⭐</option>
            </select>
            <input type="text" class="input-comment" placeholder="Tu reseña..." style="padding:4px; font-size:0.8rem; width:100%; margin:4px 0;">
            <button class="btn-primary" style="padding:4px 8px; font-size:0.75rem; width:100%;">Enviar Reseña</button>
        `;
        
        areaReseña.querySelector("button").onclick = () => {
            const estrellas = parseInt(areaReseña.querySelector(".select-stars").value);
            const comentario = areaReseña.querySelector(".input-comment").value.trim();
            if (comentario === "") return alert("Escribe un comentario.");
            
            agregarReseñaAProducto(prod.id, estrellas, comentario);
        };
        actionsArea.appendChild(areaReseña);
    }

    return card;
}

function filtrarProductos() {
    const texto = document.getElementById("search-input").value.toLowerCase();
    const categoria = document.getElementById("category-filter").value;
    const precioRango = document.getElementById("price-filter").value;

    const filtrados = listadoProductosGlobal.filter(p => {
        const coincideTexto = p.titulo.toLowerCase().includes(texto);
        const coincideCat = (categoria === "Todos" || p.categoria === categoria);
        
        let coincidePrecio = true;
        if (precioRango === "bajo") coincidePrecio = (p.precio < 100);
        else if (precioRango === "medio") coincidePrecio = (p.precio >= 100 && p.precio <= 500);
        else if (precioRango === "alto") coincidePrecio = (p.precio > 500);

        return coincideTexto && coincideCat && coincidePrecio;
    });

    const grid = document.getElementById("catalogo-productos-grid");
    if (!grid) return;
    grid.innerHTML = "";
    filtrados.forEach(p => grid.appendChild(crearTarjetaProductoHtml(p, false)));
}

function agregarAlCarrito(idProducto) {
    const producto = listadoProductosGlobal.find(p => p.id === idProducto);
    if (!producto) return;

    const itemEnCarrito = carrito.find(item => item.id === idProducto);
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    actualizarContadorCarritoVisual();
}

function actualizarContadorCarritoVisual() {
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.getElementById("cart-count").textContent = totalItems;
}

function renderizarCarritoCompras() {
    const container = document.getElementById("carrito-items-list");
    if (!container) return;
    container.innerHTML = "";

    if (carrito.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">El carrito de compras está vacío.</p>`;
        actualizarMontosTotalesCarrito(0);
        return;
    }

    let subtotalAcumulado = 0;

    carrito.forEach(item => {
        const montoItem = item.precio * item.cantidad;
        subtotalAcumulado += montoItem;

        const row = document.createElement("div");
        row.className = "cart-item-row";
        row.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}">
            <div class="cart-item-details">
                <h4 style="font-weight:700;">${item.titulo}</h4>
                <p style="color:var(--text-muted); font-size:0.9rem;">Precio Unitario: $${item.precio.toFixed(2)}</p>
                <p style="font-weight:bold; margin-top:4px;">Subtotal: $${montoItem.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button onclick="alterarCantidadItemCarrito(${item.id}, -1)">-</button>
                <span style="font-weight:bold; font-size:1.1rem; padding: 0 5px;">${item.cantidad}</span>
                <button onclick="alterarCantidadItemCarrito(${item.id}, 1)">+</button>
            </div>
            <button class="btn-danger" style="padding:6px 12px; font-size:0.8rem; margin-top: 5px;" onclick="eliminarCompletamenteDelCarrito(${item.id})">🗑️ Quitar</button>
        `;
        container.appendChild(row);
    });

    actualizarMontosTotalesCarrito(subtotalAcumulado);
}

function alterarCantidadItemCarrito(idProducto, cambio) {
    const item = carrito.find(i => i.id === idProducto);
    if (!item) return;

    item.cantidad += cambio;
    if (item.cantidad <= 0) {
        eliminarCompletamenteDelCarrito(idProducto);
    } else {
        actualizarContadorCarritoVisual();
        renderizarCarritoCompras();
    }
}

function eliminarCompletamenteDelCarrito(idProducto) {
    carrito = carrito.filter(i => i.id !== idProducto);
    actualizarContadorCarritoVisual();
    renderizarCarritoCompras();
}

function actualizarMontosTotalesCarrito(subtotal) {
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    document.getElementById("cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("cart-tax").textContent = `$${iva.toFixed(2)}`;
    document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

function abrirPasarelaPago() {
    if (carrito.length === 0) return alert("El carrito está vacío.");
    if (!usuarioSesionActiva) {
        alert("⚠️ Debes iniciar sesión en tu perfil para completar la orden.");
        mostrarSeccionPerfil();
        return;
    }
    document.getElementById("checkout-modal").classList.remove("hidden-element");
}

function cerrarPasarela() {
    document.getElementById("checkout-modal").classList.add("hidden-element");
    document.getElementById("checkout-form").reset();
}

function procesarCompraCarrito(e) {
    e.preventDefault();
    
    const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalConIva = subtotal * 1.16;

    const nuevaOrden = {
        idPedido: `PED-${Math.floor(10000 + Math.random() * 90000)}`,
        clienteNombre: usuarioSesionActiva.nombre,
        clienteEmail: usuarioSesionActiva.correo,
        direccion: usuarioSesionActiva.direccion || "Despacho en Campus UCAB Montalbán",
        productos: [...carrito],
        total: totalConIva,
        estadoEnvio: "Pendiente"
    };

    historialVentasGlobal.push(nuevaOrden);
    actualizarLocalStorageVentas();

    carrito = [];
    actualizarContadorCarritoVisual();
    cerrarPasarela();
    alert(`🎉 ¡Pago Autorizado de forma exitosa!\nCódigo de Factura: ${nuevaOrden.idPedido}`);
    navegarA('inicio');
}

/* ==========================================================================
   MÓDULO 4 Y 6: SISTEMA CRUD Y PANEL DE MÉTRICAS (ADMIN)
   ========================================================================== */
function renderizarPanelAdmin() {
    if (!usuarioSesionActiva || usuarioSesionActiva.rol !== "Administrador") {
        navegarA('inicio');
        return;
    }

    const totalIngresos = historialVentasGlobal.reduce((acc, v) => acc + v.total, 0);
    document.getElementById("metric-ingresos").textContent = `$${totalIngresos.toFixed(2)}`;
    document.getElementById("metric-ordenes").textContent = historialVentasGlobal.length;
    document.getElementById("metric-productos-count").textContent = listadoProductosGlobal.length;

    const tbody = document.getElementById("admin-ventas-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    historialVentasGlobal.forEach(v => {
        const tr = document.createElement("tr");
        const prodResumen = v.productos.map(p => `${p.titulo} (x${p.cantidad})`).join("<br>");
        
        tr.innerHTML = `
            <td style="font-weight:bold; color:var(--ucab-blue);">${v.idPedido}</td>
            <td><strong>${v.clienteNombre}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${v.clienteEmail}</span></td>
            <td style="font-size:0.85rem;">${v.direccion}</td>
            <td style="font-size:0.85rem;">${prodResumen}</td>
            <td style="font-weight:bold;">$${v.total.toFixed(2)}</td>
            <td><span class="status-bar online" style="font-size:0.75rem;">${v.estadoEnvio}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function procesarFormularioCRUD(e) {
    e.preventDefault();

    const idProd = document.getElementById("crud-product-id").value;
    const titulo = document.getElementById("crud-title").value.trim();
    const precio = parseFloat(document.getElementById("crud-price").value);
    const categoria = document.getElementById("crud-category").value;
    const imagen = document.getElementById("crud-image").value.trim();

    if (idProd === "") {
        const nuevo = {
            id: Date.now(),
            titulo,
            precio,
            categoria,
            imagen,
            reseñas: []
        };
        listadoProductosGlobal.push(nuevo);
        alert("✨ Producto creado e insertado en el catálogo.");
    } else {
        const producto = listadoProductosGlobal.find(p => p.id === parseInt(idProd));
        if (producto) {
            producto.titulo = titulo;
            producto.precio = precio;
            producto.categoria = categoria;
            producto.imagen = imagen;
            alert("✏️ Atributos del producto actualizados con éxito.");
        }
    }

    actualizarLocalStorageProductos();
    limpiarFormularioCRUD();
    renderizarSeccionInicio();
    renderizarPanelAdmin();
}

function cargarProductoEnFormularioCRUD(idProducto) {
    const prod = listadoProductosGlobal.find(p => p.id === idProducto);
    if (!prod) return;

    document.getElementById("crud-form-title").textContent = "✏️ Editando Producto del Inventario";
    document.getElementById("crud-product-id").value = prod.id;
    document.getElementById("crud-title").value = prod.titulo;
    document.getElementById("crud-price").value = prod.precio;
    document.getElementById("crud-category").value = prod.categoria;
    document.getElementById("crud-image").value = prod.imagen;

    document.getElementById("btn-cancel-crud").classList.remove("hidden-element");
    document.getElementById("product-crud-form").scrollIntoView({ behavior: 'smooth' });
}

function eliminarProductoDeInventario(idProducto) {
    if (!confirm("⚠️ ¿Estás completamente seguro de que deseas eliminar este producto del catálogo permanentemente?")) return;
    
    listadoProductosGlobal = listadoProductosGlobal.filter(p => p.id !== idProducto);
    actualizarLocalStorageProductos();
    renderizarCatalogoProductos();
    renderizarSeccionInicio();
    alert("🗑️ Producto removido del inventario.");
}

function limpiarFormularioCRUD() {
    document.getElementById("product-crud-form").reset();
    document.getElementById("crud-product-id").value = "";
    document.getElementById("crud-form-title").textContent = "Añadir Nuevo Producto al Inventario";
    document.getElementById("btn-cancel-crud").classList.add("hidden-element");
}

/* ==========================================================================
   MÓDULO 5: RESEÑAS Y FEEDBACK INTERACTIVO
   ========================================================================== */
function agregarReseñaAProducto(idProducto, estrellas, comentario) {
    const prod = listadoProductosGlobal.find(p => p.id === idProducto);
    if (!prod) return;

    const nombreUsuario = usuarioSesionActiva ? usuarioSesionActiva.nombre : "Invitado Anónimo";
    
    if (!prod.reseñas) prod.reseñas = [];
    prod.reseñas.push({ usuario: nombreUsuario, estrellas, comentario });

    actualizarLocalStorageProductos();
    alert("📝 ¡Gracias por tu opinión! Reseña agregada.");
    renderizarCatalogoProductos();
}

/* ==========================================================================
   REQUERIMIENTOS NO FUNCIONALES (TEMAS Y CONEXIÓN)
   ========================================================================== */
function inicializarTemas() {
    const temaGuardado = localStorage.getItem("ucab_theme") || "light";
    document.documentElement.setAttribute("data-theme", temaGuardado);
    actualizarBotonTemaVisual(temaGuardado);

    document.getElementById("theme-toggle").addEventListener("click", () => {
        const temaActual = document.documentElement.getAttribute("data-theme");
        const nuevoTema = (temaActual === "dark") ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", nuevoTema);
        localStorage.setItem("ucab_theme", nuevoTema);
        actualizarBotonTemaVisual(nuevoTema);
    });
}

function actualizarBotonTemaVisual(tema) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.textContent = (tema === "dark") ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
}

function inicializarEstadoConexion() {
    const status = document.getElementById("connection-status");
    if (!status) return;

    const cambiarEstado = (online) => {
        if (online) {
            status.textContent = "Modo Online";
            status.className = "status-bar online";
        } else {
            status.textContent = "Modo Offline (Simulado)";
            status.className = "status-bar offline";
        }
    };

    window.addEventListener("online", () => cambiarEstado(true));
    window.addEventListener("offline", () => cambiarEstado(false));
    cambiarEstado(navigator.onLine);
}