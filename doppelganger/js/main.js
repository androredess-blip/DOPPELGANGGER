import { ranking } from "./puntaje.js";
import { crearMapa, pintarSitios, centrarEn } from "./mapa.js";
import { mostrarFicha } from "./ficha.js";

const estado = {
  cuerpo: "marte",
  filtro: "todos",
  seleccionado: null,
};

let datos;

async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`No se pudo leer ${ruta}`);
  return resp.json();
}

async function cargarDatos() {
  const [modelo, sitios, clima] = await Promise.all([
    cargarJSON("data/modelo.json"),
    cargarJSON("data/sitios.json"),
    cargarJSON("data/clima.json"),
  ]);
  return { modelo, sitios, clima: clima.sitios };
}

function resultadosVisibles() {
  const todos = ranking(datos.sitios, datos.clima, datos.modelo, estado.cuerpo);
  if (estado.filtro === "todos") return todos;
  return todos.filter((r) => r.sitio.tipo === estado.filtro);
}

function pintarRanking(resultados) {
  const tabla = document.getElementById("ranking");
  tabla.innerHTML = resultados
    .map(
      (r, i) => `
      <li class="${r.sitio.id === estado.seleccionado ? "elegido" : ""}">
        <button type="button" data-id="${r.sitio.id}">
          <span class="pos">${i + 1}</span>
          <span class="nombre">${r.sitio.nombre}<small>${r.sitio.pais}${r.sitio.tipo === "candidato" ? " · candidato" : ""}</small></span>
          <span class="mini-barra"><span style="width:${r.total}%"></span></span>
          <b>${r.total}</b>
        </button>
      </li>`
    )
    .join("");
}

function seleccionar(id, mover = true) {
  estado.seleccionado = id;
  const sitio = datos.sitios.find((s) => s.id === id);
  mostrarFicha(document.getElementById("ficha"), sitio, datos.clima[id], datos.modelo, estado.cuerpo);
  if (mover) centrarEn(sitio);
  actualizar(false);
  document.getElementById("ficha").scrollIntoView({ behavior: "smooth", block: "start" });
}

function actualizar(refrescarFicha = true) {
  const resultados = resultadosVisibles();
  pintarRanking(resultados);
  pintarSitios(resultados, estado.seleccionado, (id) => seleccionar(id));

  document.querySelectorAll("[data-cuerpo]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.cuerpo === estado.cuerpo);
  });
  document.getElementById("titulo-ranking").textContent =
    estado.cuerpo === "luna" ? "Ranking: parecido a la Luna (polo sur)" : "Ranking: parecido a Marte";

  if (refrescarFicha && estado.seleccionado) {
    const sitio = datos.sitios.find((s) => s.id === estado.seleccionado);
    mostrarFicha(document.getElementById("ficha"), sitio, datos.clima[sitio.id], datos.modelo, estado.cuerpo);
  }
}

function pintarMetodologia() {
  const { modelo } = datos;
  const filas = modelo.dimensiones
    .map((d) => {
      const desc = (claves) =>
        claves.length ? claves.map((c) => modelo.indicadores[c].nombre).join(", ") : "No aplica";
      const peso = (c) => `${Math.round(modelo.pesos[c][d.id] * 100)} %`;
      return `<tr>
        <td>${d.nombre}</td>
        <td>${desc(d.luna)}</td><td class="num">${peso("luna")}</td>
        <td>${desc(d.marte)}</td><td class="num">${peso("marte")}</td>
      </tr>`;
    })
    .join("");
  document.getElementById("tabla-dimensiones").innerHTML = filas;

  const umbrales = Object.values(modelo.indicadores)
    .filter((i) => i.tipo !== "rasgo")
    .map((i) => `<tr><td>${i.nombre}</td><td>${i.fuente}</td><td class="num">${i.min}</td><td class="num">${i.max}</td></tr>`)
    .join("");
  document.getElementById("tabla-umbrales").innerHTML = umbrales;

  document.getElementById("total-sitios").textContent = datos.sitios.length;
  document.getElementById("total-candidatos").textContent = datos.sitios.filter((s) => s.tipo === "candidato").length;
}

function conectarControles() {
  document.querySelectorAll("[data-cuerpo]").forEach((b) =>
    b.addEventListener("click", () => {
      estado.cuerpo = b.dataset.cuerpo;
      actualizar();
    })
  );

  document.getElementById("filtro").addEventListener("change", (e) => {
    estado.filtro = e.target.value;
    actualizar(false);
  });

  document.getElementById("ranking").addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-id]");
    if (boton) seleccionar(boton.dataset.id);
  });
}

async function iniciar() {
  try {
    datos = await cargarDatos();
  } catch (err) {
    document.getElementById("ranking").innerHTML =
      `<li class="aviso">No se pudieron cargar los datos. Si abriste el archivo directo, usa un servidor local (ver README).</li>`;
    console.error(err);
    return;
  }

  crearMapa("mapa");
  conectarControles();
  pintarMetodologia();

  const primero = ranking(datos.sitios, datos.clima, datos.modelo, estado.cuerpo)[0];
  estado.seleccionado = primero.sitio.id;
  actualizar();
}

iniciar();
