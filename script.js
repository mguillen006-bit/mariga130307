// =========================================================
// script.js
// Carrito de compras + juego "Adivina el personaje"
// (Rick and Morty API: https://rickandmortyapi.com)
// =========================================================

// ---------------------------------------------------------
// CARRITO DE COMPRAS
// ---------------------------------------------------------
let carrito = [];

function agregarProducto(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarrito();
}

function actualizarCarrito() {
    const lista = document.getElementById('listaCarrito');
    const contador = document.getElementById('contadorCarrito');
    const total = document.getElementById('totalCarrito');

    contador.textContent = carrito.length;

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="text-muted mb-0">El carrito está vacío</p>';
    } else {
        lista.innerHTML = carrito.map(producto => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small">${producto.nombre}</span>
                <span class="small fw-bold">$${producto.precio.toFixed(2)}</span>
            </div>
        `).join('');
    }

    const sumaTotal = carrito.reduce((acumulado, producto) => acumulado + producto.precio, 0);
    total.textContent = sumaTotal.toFixed(2);
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarrito();
}

// ---------------------------------------------------------
// JUEGO: ADIVINA EL PERSONAJE
// La API tiene alrededor de 826 personajes numerados.
// ---------------------------------------------------------
const TOTAL_PERSONAJES = 826;

let personajeActual = null;
let aciertos = 0;
let rondas = 0;
let pistasUsadas = 0;
let rondaResuelta = false;

// Quita acentos y pasa a minúsculas para poder comparar
// "Rick" con "rick" o "Morti" con errores de acento.
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
}

async function obtenerPersonajeAleatorio() {
    const id = Math.floor(Math.random() * TOTAL_PERSONAJES) + 1;
    const respuesta = await fetch(`https://rickandmortyapi.com/api/character/${id}`);
    if (!respuesta.ok) {
        throw new Error('No se pudo obtener el personaje');
    }
    return respuesta.json();
}

function mostrarEstado(mensaje, tipo = 'secondary') {
    const estado = document.getElementById('estadoJuego');
    estado.className = `alert alert-${tipo}`;
    estado.textContent = mensaje;
}

function limpiarFicha() {
    document.getElementById('fichaPersonaje').innerHTML = '';
}

function llenarFicha(personaje) {
    const filas = [
        ['Nombre', personaje.name],
        ['Especie', personaje.species],
        ['Género', personaje.gender],
        ['Estado', personaje.status],
        ['Origen', personaje.origin?.name || 'Desconocido'],
        ['Ubicación actual', personaje.location?.name || 'Desconocida']
    ];

    document.getElementById('fichaPersonaje').innerHTML = filas.map(([dato, valor]) => `
        <tr>
            <td>${dato}</td>
            <td>${valor}</td>
        </tr>
    `).join('');
}

async function iniciarRonda() {
    const imagen = document.getElementById('imagenPersonaje');

    mostrarEstado('Cargando personaje...', 'secondary');
    limpiarFicha();
    document.getElementById('respuesta').value = '';
    document.getElementById('textoPista').textContent = '';
    imagen.classList.add('silueta');
    imagen.src = '';

    pistasUsadas = 0;
    rondaResuelta = false;

    try {
        personajeActual = await obtenerPersonajeAleatorio();
        imagen.src = personajeActual.image;
        imagen.alt = 'Silueta de un personaje de Rick y Morty';
        mostrarEstado('Silueta lista. ¡Escribe tu respuesta!', 'secondary');
    } catch (error) {
        mostrarEstado('Ocurrió un error al pedir el personaje. Intenta con "Nuevo personaje".', 'danger');
        console.error(error);
    }
}

function actualizarMarcador() {
    document.getElementById('marcadorAciertos').textContent = aciertos;
    document.getElementById('marcadorRondas').textContent = rondas;
}

function adivinar() {
    if (!personajeActual || rondaResuelta) return;

    const respuestaUsuario = document.getElementById('respuesta').value;
    if (!respuestaUsuario.trim()) {
        mostrarEstado('Escribe un nombre antes de adivinar.', 'warning');
        return;
    }

    rondas++;
    rondaResuelta = true;

    if (normalizarTexto(respuestaUsuario) === normalizarTexto(personajeActual.name)) {
        aciertos++;
        document.getElementById('imagenPersonaje').classList.remove('silueta');
        llenarFicha(personajeActual);
        mostrarEstado(`¡Correcto! Es ${personajeActual.name}.`, 'success');
    } else {
        document.getElementById('imagenPersonaje').classList.remove('silueta');
        llenarFicha(personajeActual);
        mostrarEstado(`Casi. Era ${personajeActual.name}.`, 'danger');
    }

    actualizarMarcador();
}

function darPista() {
    if (!personajeActual || rondaResuelta) return;

    pistasUsadas++;
    const textoPista = document.getElementById('textoPista');

    if (pistasUsadas === 1) {
        textoPista.textContent = `Pista: es de la especie "${personajeActual.species}".`;
    } else if (pistasUsadas === 2) {
        textoPista.textContent = `Pista: su estado es "${personajeActual.status}".`;
    } else {
        const primeraLetra = personajeActual.name.charAt(0);
        textoPista.textContent = `Pista: su nombre empieza con "${primeraLetra}".`;
    }
}

function rendirse() {
    if (!personajeActual || rondaResuelta) return;

    rondas++;
    rondaResuelta = true;

    document.getElementById('imagenPersonaje').classList.remove('silueta');
    llenarFicha(personajeActual);
    mostrarEstado(`Era ${personajeActual.name}. ¡A la siguiente!`, 'warning');

    actualizarMarcador();
}

// ---------------------------------------------------------
// PRUEBAS DE FUNCIONAMIENTO
// Cada prueba se agrega a la lista y también se imprime
// en la consola del navegador (F12).
// ---------------------------------------------------------
function agregarResultadoPrueba(nombre, paso) {
    const lista = document.getElementById('resultadosPruebas');
    const item = document.createElement('li');
    item.className = `list-group-item ${paso ? 'list-group-item-success' : 'list-group-item-danger'}`;
    item.textContent = `${paso ? '✔' : '✘'} ${nombre}`;
    lista.appendChild(item);

    if (paso) {
        console.log(`[PRUEBA OK] ${nombre}`);
    } else {
        console.error(`[PRUEBA FALLÓ] ${nombre}`);
    }
}

async function ejecutarPruebas() {
    const lista = document.getElementById('resultadosPruebas');
    lista.innerHTML = '';

    // Prueba 1: normalizarTexto ignora mayúsculas y acentos
    agregarResultadoPrueba(
        'normalizarTexto ignora mayúsculas y acentos',
        normalizarTexto('Rick Sánchez') === normalizarTexto('rick sanchez')
    );

    // Prueba 2: la API responde con los campos esperados
    try {
        const personaje = await obtenerPersonajeAleatorio();
        const tieneCampos = Boolean(
            personaje.name && personaje.species && personaje.image && personaje.status
        );
        agregarResultadoPrueba('La API devuelve un personaje con nombre, especie, estado e imagen', tieneCampos);
    } catch (error) {
        agregarResultadoPrueba('La API respondió correctamente', false);
        console.error(error);
    }

    // Prueba 3: el carrito calcula bien el total
    const carritoAnterior = carrito;
    carrito = [{ nombre: 'Prueba', precio: 100 }, { nombre: 'Prueba 2', precio: 50 }];
    actualizarCarrito();
    const totalCorrecto = document.getElementById('totalCarrito').textContent === '150.00';
    agregarResultadoPrueba('El carrito suma los precios correctamente', totalCorrecto);
    carrito = carritoAnterior;
    actualizarCarrito();

    // Prueba 4: los elementos clave del juego existen en el HTML
    const idsEsperados = [
        'estadoJuego', 'imagenPersonaje', 'respuesta', 'btnAdivinar',
        'btnPista', 'btnRendirse', 'btnNuevo', 'fichaPersonaje'
    ];
    const todosExisten = idsEsperados.every(id => document.getElementById(id) !== null);
    agregarResultadoPrueba('Todos los elementos del juego existen en la página', todosExisten);
}

// ---------------------------------------------------------
// EVENTOS: se conectan cuando el HTML ya está listo
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnVaciar').addEventListener('click', vaciarCarrito);

    document.getElementById('btnAdivinar').addEventListener('click', adivinar);
    document.getElementById('btnPista').addEventListener('click', darPista);
    document.getElementById('btnRendirse').addEventListener('click', rendirse);
    document.getElementById('btnNuevo').addEventListener('click', iniciarRonda);
    document.getElementById('btnPruebas').addEventListener('click', ejecutarPruebas);

    document.getElementById('respuesta').addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            adivinar();
        }
    });

    iniciarRonda();
});