// --- CONFIGURACIÓN DE PERSISTENCIA SEGÚN EXIGENCIA DE LA RÚBRICA ---
let listadoProductosGlobal = [];
let carrito = [];
let historialVentasGlobal = [];

// Semilla de Productos iniciales si no hay en localStorage (Simulación de API externa)
const productosSemilla = [
    { id: 1, titulo: "Laptop Ultrawide Pro", precio: 1200.00, categoria: "Tecnología", imagen: "https://picsum.photos/300/200?random=1", reseñas: [{ usuario: "Carlos Pérez", estrellas: 5, comentario: "Excelente para desarrollo web" }] },
    { id: 2, titulo: "Auriculares ANC Inalámbricos", precio: 150.00, categoria: "Audio", imagen: "https://picsum.photos/300/200?random=2", reseñas: [] },
    { id: 3, titulo: "Teclado Mecánico RGB", precio: 95.00, categoria: "Accesorios", imagen: "https://picsum.photos/300/200?random=3", reseñas: [] }
];

const ventasSemilla = [
    { idPedido: "PED-10024", clienteNombre: "Carlos Pérez", clienteEmail: "carlos@ucab.edu.ve", direccion: "Caracas, Venezuela", productos: [{ id: 1, titulo: "Laptop Ultrawide Pro", cantidad: 1, precio: 1200.00 }], total: 1200.00, estadoEnvio: "Pendiente" }
];

// Cargar información desde localStorage al arrancar
function cargarPersistenciaLocal() {
    if (!localStorage.getItem("ucab_productos")) {
        localStorage.setItem("ucab_productos", JSON.stringify(productosSemilla));
    }
    if (!localStorage.getItem("ucab_ventas")) {
        localStorage.setItem("ucab_ventas", JSON.stringify(ventasSemilla));
    }
    
    // Inyectar usuarios de prueba por defecto de forma permanente
    if (!localStorage.getItem("user_admin@ucab.edu.ve")) {
        localStorage.setItem("user_admin@ucab.edu.ve", JSON.stringify({ nombre: "Profesor Evaluador", correo: "admin@ucab.edu.ve", clave: "1234", rol: "Administrador" }));
    }
    if (!localStorage.getItem("user_cliente@ucab.edu.ve")) {
        localStorage.setItem("user_cliente@ucab.edu.ve", JSON.stringify({ nombre: "Carlos Pérez", correo: "cliente@ucab.edu.ve", clave: "1234", rol: "Cliente", direccion: "Sede UCAB Montalbán" }));
    }

    listadoProductosGlobal = JSON.parse(localStorage.getItem("ucab_productos"));
    historialVentasGlobal = JSON.parse(localStorage.getItem("ucab_ventas"));
}

function guardarProductosEnDisk() {
    localStorage.setItem("ucab_productos", JSON.stringify(listadoProductosGlobal));
}

function guardarVentasEnDisk() {
    localStorage.setItem("ucab_ventas", JSON.stringify(historialVentasGlobal));
}

// Inicializador de Ciclo de Vida de la SPA
document.addEventListener("DOMContentLoaded", () => {
    cargarPersistenciaLocal();
    inicializarTemaUsuario();
    inicializarEstadoConexion();
    verificarSesionActiva();
    renderizarDestacadosInicio();
    renderizarCatalogo(listadoProductosGlobal);
    
    const crudForm = document.getElementById("crud-form");
    if (crudForm) {
        crudForm.addEventListener("submit", procesarFormularioCRUD);
    }

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value;
            const pass = document.getElementById("login-pass").value;
            const userRaw = localStorage.getItem(`user_${email}`);

            if (userRaw) {
                const user = JSON.parse(userRaw);
                if (user.clave === pass) {
                    sessionStorage.setItem("activeSession", JSON.stringify(user));
                    verificarSesionActiva();
                    renderizarCatalogo(listadoProductosGlobal);
                    navegarA('inicio');
                    return;
                }
            }
            alert("Credenciales incorrectas.");
        });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const mail = document.getElementById("reg-email").value;
            const nuevoUsuario = {
                nombre: document.getElementById("reg-name").value,
                correo: mail,
                clave: document.getElementById("reg-pass").value,
                rol: document.getElementById("reg-role").value,
                direccion: "Caracas, Venezuela"
            };
            localStorage.setItem(`user_${mail}`, JSON.stringify(nuevoUsuario));
            alert("¡Usuario registrado con éxito!");
            conmutarFormularios(false);
        });
    }
});

function inicializarTemaUsuario() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;
    
    const temaGuardado = localStorage.getItem("ucab_theme") || "light";
    document.documentElement.setAttribute("data-theme", temaGuardado);
    themeToggle.textContent = temaGuardado === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro";

    themeToggle.onclick = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("ucab_theme", newTheme);
        themeToggle.textContent = newTheme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    };
}

// --- ENRUTADOR DINÁMICO (SPA) DEFINITIVO Y CORREGIDO ---
function navegarA(vistaTarget) {
    // 1. Ocultar todas las secciones principales de la SPA
    document.querySelectorAll(".spa-view").forEach(v => {
        v.classList.add("hidden-element");
    });
    
    // 2. Apagar de forma explícita el contenedor de Autenticación/Perfil y el Panel de Control Maestro
    const authSec = document.getElementById("auth-section");
    if (authSec) authSec.classList.add("hidden-element");
    
    const adminMaster = document.getElementById("admin-master-container");
    if (adminMaster) adminMaster.classList.add("hidden-element");

    // 3. Mostrar únicamente la vista correspondiente al target (inicio, catalogo, carrito)
    const target = document.getElementById(`vista-${vistaTarget}`);
    if (target) target.classList.remove("hidden-element");
    
    if (vistaTarget === 'carrito') actualizarCarritoUI();
}

// --- REDIRECCIÓN EXCLUSIVA AL PERFIL DESDE EL NAVBAR ---
function mostrarSeccionPerfil() {
    // 1. Ocultar todas las pestañas de la SPA
    document.querySelectorAll(".spa-view").forEach(v => {
        v.classList.add("hidden-element");
    });
    
    // 2. Mostrar la vista contenedora del Perfil/Login
    const authSec = document.getElementById("auth-section");
    if (authSec) authSec.classList.remove("hidden-element");

    // 3. Si hay sesión iniciada y es Administrador, activar su panel maestro justo abajo de su perfil
    const sesion = sessionStorage.getItem("activeSession");
    if (sesion) {
        const user = JSON.parse(sesion);
        const userRol = user.role || user.rol;
        const adminMaster = document.getElementById("admin-master-container");
        
        if (userRol === "Administrador" && adminMaster) {
            adminMaster.classList.remove("hidden-element");
        }
    }
}

function conmutarFormularios(mostrarRegistro) {
    const loginWrapper = document.getElementById("login-form-wrapper");
    const registerWrapper = document.getElementById("register-form-wrapper");
    
    if (loginWrapper) loginWrapper.classList.toggle("hidden-element", mostrarRegistro);
    if (registerWrapper) registerWrapper.classList.toggle("hidden-element", !mostrarRegistro);
}

function calcularPromedioEstrellas(reseñas) {
    if (!reseñas || reseñas.length === 0) return "☆☆☆☆☆ (0)";
    const suma = reseñas.reduce((acc, r) => acc + r.estrellas, 0);
    const promedio = Math.round(suma / reseñas.length);
    return `${"★".repeat(promedio)}${"☆".repeat(5 - promedio)} (${reseñas.length})`;
}

function renderizarDestacadosInicio() {
    const container = document.getElementById("destacados-container");
    if (!container) return;
    const destacados = listadoProductosGlobal.slice(0, 3);
    container.innerHTML = destacados.map(prod => `
        <div class="producto-card">
            <img src="${prod.imagen}" alt="${prod.titulo}">
            <div class="producto-info">
                <span class="categoria-tag">${prod.categoria}</span>
                <h3>${prod.titulo}</h3>
                <p class="precio">$${prod.precio.toFixed(2)}</p>
                <button class="btn-add-cart" onclick="agregarAlCarrito(${prod.id})">Agregar al Carrito</button>
            </div>
        </div>
    `).join('');
}

function renderizarCatalogo(lista) {
    const container = document.getElementById("catalogo-container");
    if (!container) return;
    
    const sesion = sessionStorage.getItem("activeSession");
    const esAdmin = sesion ? JSON.parse(sesion).rol === "Administrador" : false;

    container.innerHTML = lista.map(prod => {
        const ratingHtml = calcularPromedioEstrellas(prod.reseñas);
        const opinionesHtml = prod.reseñas ? prod.reseñas.map(r => `
            <div style="font-size:0.8rem; margin-top:5px; border-bottom:1px solid var(--border-color); padding-bottom: 2px;">
                <strong>${r.usuario}:</strong> ${r.comentario} (${"★".repeat(r.estrellas)})
            </div>
        `).join('') : '';

        return `
            <div class="producto-card">
                <img src="${prod.imagen}" alt="${prod.titulo}">
                <div class="producto-info">
                    <span class="categoria-tag">${prod.categoria}</span>
                    <h3>${prod.titulo}</h3>
                    <div style="color:#ffc107; font-size:0.9rem;">${ratingHtml}</div>
                    <p class="precio">$${prod.precio.toFixed(2)}</p>
                    
                    ${esAdmin ? `
                        <div style="display:flex; gap:5px; margin-top:10px;">
                            <button style="flex:1; padding:5px; background:#ffc107; color:#2d3748; border:none; border-radius:4px; cursor:pointer;" onclick="cargarProductoEnFormulario(${prod.id})">✏️ Editar</button>
                            <button style="flex:1; padding:5px; background:#e53e3e; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="eliminarProductoCRUD(${prod.id})">🗑️ Eliminar</button>
                        </div>
                    ` : `
                        <button class="btn-add-cart" onclick="agregarAlCarrito(${prod.id})">Agregar al Carrito</button>
                    `}
                </div>
                <div class="product-feedback-section">
                    <h4>Opiniones:</h4>
                    ${opinionesHtml || '<p style="font-size:0.75rem; color:gray;">Sin opiniones.</p>'}
                    ${!esAdmin ? `
                        <form class="feedback-form" onsubmit="procesarNuevaReseña(event, ${prod.id})">
                            <div class="feedback-inputs-row">
                                <select required class="select-stars-input">
                                    <option value="5">5★</option><option value="4">4★</option><option value="3">3★</option>
                                </select>
                                <input type="text" placeholder="Tu opinión..." required class="text-comment-input">
                                <button type="submit" class="btn-submit-review">➔</button>
                            </div>
                        </form>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function actualizarFiltroPrecio() {
    const val = document.getElementById("price-range").value;
    const priceVal = document.getElementById("price-val");
    if (priceVal) priceVal.textContent = val;
    filtrarProductos();
}

function filtrarProductos() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-select");
    const priceRange = document.getElementById("price-range");
    
    if (!searchInput || !categorySelect || !priceRange) return;

    const busqueda = searchInput.value.toLowerCase();
    const categoria = categorySelect.value;
    const precioMax = parseFloat(priceRange.value);

    const filtrados = listadoProductosGlobal.filter(prod => {
        return prod.titulo.toLowerCase().includes(busqueda) && 
               (categoria === "todos" || prod.categoria === categoria) && 
               prod.precio <= precioMax;
    });
    renderizarCatalogo(filtrados);
}

function procesarNuevaReseña(event, idProducto) {
    event.preventDefault();
    const sesion = sessionStorage.getItem("activeSession");
    if (!sesion) return alert("Inicia sesión para opinar.");

    const usuarioActivo = JSON.parse(sesion);
    const form = event.target;
    const estrellas = parseInt(form.querySelector(".select-stars-input").value);
    const comentario = form.querySelector(".text-comment-input").value;

    const prod = listadoProductosGlobal.find(p => p.id === idProducto);
    if (prod) {
        if (!prod.reseñas) prod.reseñas = [];
        prod.reseñas.push({ usuario: usuarioActivo.nombre, estrellas, comentario });
        guardarProductosEnDisk();
        renderizarCatalogo(listadoProductosGlobal);
    }
}

function agregarAlCarrito(id) {
    const prod = listadoProductosGlobal.find(p => p.id === id);
    const item = carrito.find(i => i.id === id);
    if (item) item.cantidad++; else carrito.push({ ...prod, cantidad: 1 });
    
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = carrito.reduce((s, i) => s + i.cantidad, 0);
    actualizarCarritoUI();
}

function alterarCantidad(id, cambio) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += cambio;
    if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
    
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = Math.max(0, carrito.reduce((s, i) => s + i.cantidad, 0));
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const container = document.getElementById("carrito-items-list");
    if (!container) return;
    
    if (carrito.length === 0) {
        container.innerHTML = "<p>Carrito vacío.</p>";
        const totalEl = document.getElementById("cart-total");
        if (totalEl) totalEl.textContent = "$0.00";
        const btnCheck = document.getElementById("btn-checkout");
        if (btnCheck) btnCheck.disabled = true;
        return;
    }
    container.innerHTML = carrito.map(item => `
        <div class="cart-page-item">
            <div><h4>${item.titulo}</h4><p>$${item.precio} x ${item.cantidad}</p></div>
            <div class="cart-item-ctrls">
                <button onclick="alterarCantidad(${item.id}, -1)">-</button>
                <button onclick="alterarCantidad(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
    const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    
    const subTotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");
    const btnCheck = document.getElementById("btn-checkout");
    
    if (subTotalEl) subTotalEl.textContent = `$${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    if (btnCheck) btnCheck.disabled = false;
}

function abrirPasarela() { 
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.classList.remove("hidden-element"); 
}
function cerrarPasarela() { 
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.classList.add("hidden-element"); 
}

const checkForm = document.getElementById("checkout-form");
if (checkForm) {
    checkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const sesion = JSON.parse(sessionStorage.getItem("activeSession"));
        const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
        
        const nuevoPedido = {
            idPedido: `PED-${Math.floor(10000 + Math.random() * 90000)}`,
            clienteNombre: sesion ? sesion.nombre : "Invitado",
            clienteEmail: sesion ? sesion.correo : "anon@ucab.edu.ve",
            direccion: sesion ? (sesion.direccion || "Caracas, Sede Central") : "Sin dirección",
            productos: [...carrito],
            total: total,
            estadoEnvio: "Pendiente"
        };

        historialVentasGlobal.push(nuevoPedido);
        guardarVentasEnDisk();
        carrito = [];
        const cartCount = document.getElementById("cart-count");
        if (cartCount) cartCount.textContent = "0";
        cerrarPasarela();
        alert("¡Compra procesada y registrada!");
        navegarA('inicio');
    });
}

function cambiarPestanaAdmin(pestanaId, boton) {
    document.getElementById("admin-tab-inventario").classList.add("hidden-element");
    document.getElementById("admin-tab-ventas").classList.add("hidden-element");
    document.getElementById("admin-tab-dashboard").classList.add("hidden-element");

    document.querySelectorAll(".admin-nav-tabs button").forEach(b => b.classList.remove("active-tab"));
    document.getElementById(`admin-tab-${pestanaId}`).classList.remove("hidden-element");
    boton.classList.add("active-tab");

    if (pestanaId === 'dashboard') calcularYRenderizarDashboardADMIN();
    if (pestanaId === 'ventas') renderizarHistorialVentasADMIN();
}

function calcularYRenderizarDashboardADMIN() {
    const ingresos = historialVentasGlobal.reduce((acc, p) => acc + p.total, 0);
    const incomeEl = document.getElementById("dash-total-ventas");
    if (incomeEl) incomeEl.textContent = `$${ingresos.toFixed(2)}`;

    let totalRegistrados = 0;
    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).startsWith("user_")) totalRegistrados++;
    }
    const regEl = document.getElementById("dash-usuarios-registrados");
    const actEl = document.getElementById("dash-usuarios-activos");
    if (regEl) regEl.textContent = totalRegistrados;
    if (actEl) actEl.textContent = sessionStorage.getItem("activeSession") ? "1" : "0";

    let conteo = {};
    historialVentasGlobal.forEach(p => p.productos.forEach(pr => conteo[pr.titulo] = (conteo[pr.titulo] || 0) + pr.cantidad));
    let ordenados = Object.keys(conteo).map(t => ({ t, c: conteo[t] })).sort((a,b) => b.c - a.c).slice(0,3);

    const listEl = document.getElementById("dash-top-productos-lista");
    if (listEl) {
        listEl.innerHTML = ordenados.map((p, i) => `<li><span>#${i+1} ${p.t}</span> <strong>(${p.c} uds)</strong></li>`).join('') || '<li>Sin ventas</li>';
    }
}

function renderizarHistorialVentasADMIN() {
    const tbody = document.getElementById("admin-orders-rows");
    if (!tbody) return;
    tbody.innerHTML = historialVentasGlobal.map(p => `
        <tr>
            <td>${p.idPedido}</td>
            <td><strong>${p.clienteNombre}</strong><br>${p.direccion}</td>
            <td>${p.productos ? p.productos.map(pr => pr.titulo).join(', ') : 'Varios'}</td>
            <td>$${p.total}</td>
            <td>${p.estadoEnvio}</td>
            <td><button onclick="cambiarEstadoPedido('${p.idPedido}')">Despachar</button></td>
        </tr>
    `).join('');
}

function cambiarEstadoPedido(id) {
    const ped = historialVentasGlobal.find(p => p.idPedido === id);
    if(ped) { ped.estadoEnvio = "Enviado"; guardarVentasEnDisk(); renderizarHistorialVentasADMIN(); }
}

function procesarFormularioCRUD(e) {
    e.preventDefault();
    const idVal = document.getElementById("crud-id").value;
    const titulo = document.getElementById("crud-titulo").value;
    const precio = parseFloat(document.getElementById("crud-precio").value);
    const categoria = document.getElementById("crud-categoria").value;
    let imagen = document.getElementById("crud-imagen").value || "https://picsum.photos/300/200?random=99";

    if (idVal) {
        const index = listadoProductosGlobal.findIndex(p => p.id === parseInt(idVal));
        if (index !== -1) {
            listadoProductosGlobal[index] = { ...listadoProductosGlobal[index], titulo, precio, categoria, imagen };
        }
    } else {
        const nuevoId = Date.now();
        listadoProductosGlobal.push({ id: nuevoId, titulo, precio, categoria, imagen, reseñas: [] });
    }
    guardarProductosEnDisk();
    limpiarFormularioCRUD();
    renderizarCatalogo(listadoProductosGlobal);
    renderizarDestacadosInicio();
}

function cargarProductoEnFormulario(id) {
    const prod = listadoProductosGlobal.find(p => p.id === id);
    if (!prod) return;
    document.getElementById("crud-id").value = prod.id;
    document.getElementById("crud-titulo").value = prod.titulo;
    document.getElementById("crud-precio").value = prod.precio;
    document.getElementById("crud-categoria").value = prod.categoria;
    document.getElementById("crud-imagen").value = prod.imagen;
    
    const subBtn = document.getElementById("btn-crud-submit");
    const canBtn = document.getElementById("btn-crud-cancel");
    if (subBtn) subBtn.textContent = "Guardar Cambios";
    if (canBtn) canBtn.classList.remove("hidden-element");
}

function eliminarProductoCRUD(id) {
    listadoProductosGlobal = listadoProductosGlobal.filter(p => p.id !== id);
    guardarProductosEnDisk();
    renderizarCatalogo(listadoProductosGlobal);
    renderizarDestacadosInicio();
}

function limpiarFormularioCRUD() {
    document.getElementById("crud-id").value = "";
    const form = document.getElementById("crud-form");
    if (form) form.reset();
    const subBtn = document.getElementById("btn-crud-submit");
    const canBtn = document.getElementById("btn-crud-cancel");
    if (subBtn) subBtn.textContent = "Crear Producto";
    if (canBtn) canBtn.classList.add("hidden-element");
}

// --- CONTROLADOR INTEGRADO DE SESIÓN REVISADO ---
function verificarSesionActiva() {
    const sesion = sessionStorage.getItem("activeSession");
    const userZone = document.getElementById("nav-user-zone");
    const cartTab = document.getElementById("nav-cart-tab");
    const adminMaster = document.getElementById("admin-master-container");
    
    const loginWrapper = document.getElementById("login-form-wrapper");
    const registerWrapper = document.getElementById("register-form-wrapper");
    const profilePanel = document.getElementById("profile-panel");
    const clientFields = document.getElementById("profile-client-fields");

    if (sesion) {
        const user = JSON.parse(sesion);
        
        // 1. Actualizar Navbar
        if (userZone) {
            userZone.innerHTML = `<span onclick="mostrarSeccionPerfil()" style="cursor:pointer; font-weight:bold;">⚙️ Panel de ${user.nombre} (${user.role || user.rol})</span>`;
        }
        
        // 2. Conmutar Cajas de autenticación a Perfil
        if (loginWrapper) loginWrapper.classList.add("hidden-element");
        if (registerWrapper) registerWrapper.classList.add("hidden-element");
        if (profilePanel) profilePanel.classList.remove("hidden-element");

        // 3. Volcar información viva al perfil
        const dispName = document.getElementById("profile-display-name");
        const dispRole = document.getElementById("profile-display-role");
        if (dispName) dispName.textContent = user.nombre;
        if (dispRole) dispRole.textContent = `Rol asignado: ${user.role || user.rol}`;

        const avatarImg = document.getElementById("profile-avatar-img");
        if (avatarImg) {
            avatarImg.src = user.avatar || "https://picsum.photos/100/100?random=88";
        }

        // 4. Configurar flujos de visibilidad por Rol sin forzar visualización en pestañas externas
        const userRol = user.role || user.rol;
        if (userRol === "Administrador") {
            if (clientFields) clientFields.classList.add("hidden-element");
            if (cartTab) cartTab.classList.add("hidden-element");
            
            // SOLO se prende el bloque administrativo si la sección auth-section está activa en pantalla
            const authSec = document.getElementById("auth-section");
            if (authSec && !authSec.classList.contains("hidden-element")) {
                if (adminMaster) adminMaster.classList.remove("hidden-element");
            } else {
                if (adminMaster) adminMaster.classList.add("hidden-element");
            }
            
            calcularYRenderizarDashboardADMIN();
            renderizarHistorialVentasADMIN();
        } else {
            // Flujo Cliente
            if (clientFields) clientFields.classList.remove("hidden-element");
            if (adminMaster) adminMaster.classList.add("hidden-element");
            if (cartTab) cartTab.classList.remove("hidden-element");

            const avatarUrlInput = document.getElementById("profile-avatar-url");
            const addressInput = document.getElementById("profile-address");
            if (avatarUrlInput) avatarUrlInput.value = user.avatar || "";
            if (addressInput) addressInput.value = user.direccion || "";
        }

        const profileForm = document.getElementById("profile-update-form");
        if (profileForm) {
            profileForm.onsubmit = (e) => procesarActualizacionPerfil(e, user);
        }

    } else {
        // Estado de Invitado / Sin Sesión
        if (profilePanel) profilePanel.classList.add("hidden-element");
        if (loginWrapper) loginWrapper.classList.remove("hidden-element");
        if (adminMaster) adminMaster.classList.add("hidden-element");
        if (cartTab) cartTab.classList.add("hidden-element");
        
        if (userZone) {
            userZone.innerHTML = `<span class="nav-username" onclick="mostrarSeccionPerfil()" style="cursor:pointer;">🔑 Iniciar Sesión / Registro</span>`;
        }
    }
}

function procesarActualizacionPerfil(e, usuarioSesionOriginal) {
    e.preventDefault();
    const nuevaClave = document.getElementById("profile-new-pass").value.trim();
    const emailKey = `user_${usuarioSesionOriginal.correo}`;
    
    const dbUser = JSON.parse(localStorage.getItem(emailKey)) || usuarioSesionOriginal;

    if (nuevaClave !== "") {
        dbUser.clave = nuevaClave;
    }

    if (usuarioSesionOriginal.rol === "Cliente" || usuarioSesionOriginal.role === "Cliente") {
        const nuevoAvatar = document.getElementById("profile-avatar-url").value.trim();
        const nuevaDireccion = document.getElementById("profile-address").value.trim();

        dbUser.avatar = nuevoAvatar || "https://picsum.photos/100/100?random=88";
        dbUser.direccion = nuevaDireccion;
    }

    localStorage.setItem(emailKey, JSON.stringify(dbUser));
    sessionStorage.setItem("activeSession", JSON.stringify(dbUser));

    alert("🎉 ¡Datos actualizados de forma persistente!");
    verificarSesionActiva();
}

function cerrarSesion() {
    sessionStorage.removeItem("activeSession");
    location.reload();
}

function inicializarEstadoConexion() {
    const status = document.getElementById("connection-status");
    if (!status) return;
    window.addEventListener("online", () => { status.textContent = "Modo Online"; status.className="status-bar online"; });
    window.addEventListener("offline", () => { status.textContent = "Modo Offline (LocalStorage Activo)"; status.className="status-bar offline"; });
}