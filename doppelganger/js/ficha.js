import { calcular, fortalezasYDebilidades } from "./puntaje.js";
import { dibujarRadar } from "./radar.js";

const NOMBRE_CUERPO = { luna: "la Luna", marte: "Marte" };

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const num = (v, dec = 1) => (v == null ? "—" : Number(v).toFixed(dec));

function lista(dims) {
  return dims.map((d) => `<li>${esc(d.nombre)} <span class="dato">${Math.round(d.valor * 100)}</span></li>`).join("");
}

function barras(resultado) {
  return resultado.dimensiones
    .map((d) => {
      if (d.valor == null || !d.peso) {
        return `<div class="barra no-aplica"><span>${esc(d.nombre)}</span><em>no aplica</em></div>`;
      }
      const pct = Math.round(d.valor * 100);
      return `<div class="barra">
        <span>${esc(d.nombre)}</span>
        <div class="pista"><div class="relleno" style="width:${pct}%"></div></div>
        <b>${pct}</b>
      </div>`;
    })
    .join("");
}

export function mostrarFicha(contenedor, sitio, clima, modelo, cuerpo) {
  const luna = calcular(sitio, clima, modelo, "luna");
  const marte = calcular(sitio, clima, modelo, "marte");
  const activo = cuerpo === "luna" ? luna : marte;
  const { fuertes, debiles } = fortalezasYDebilidades(activo);

  const fuentes = sitio.fuentes.length
    ? sitio.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a></li>`).join("")
    : `<li class="aviso">Sin fuente todavía. Falta investigar este sitio.</li>`;

  contenedor.innerHTML = `
    <header class="ficha-cabecera">
      <div>
        <p class="ficha-lugar">${esc(sitio.lugar)}, ${esc(sitio.pais)}</p>
        <h3>${esc(sitio.nombre)}</h3>
      </div>
      <div class="etiquetas">
        <span class="etiqueta ${sitio.tipo}">${sitio.tipo === "candidato" ? "Candidato nuevo" : "Análogo conocido"}</span>
        ${sitio.verificado ? "" : `<span class="etiqueta pendiente">Por verificar</span>`}
      </div>
    </header>

    <p>${esc(sitio.resumen)}</p>

    <div class="puntajes">
      <div class="puntaje ${cuerpo === "luna" ? "activo" : ""}">
        <span>Luna</span><b>${luna.total}</b><small>${esc(luna.nivel)}</small>
      </div>
      <div class="puntaje ${cuerpo === "marte" ? "activo" : ""}">
        <span>Marte</span><b>${marte.total}</b><small>${esc(marte.nivel)}</small>
      </div>
    </div>

    <div class="ficha-graficas">
      <figure>
        <div id="radar"></div>
        <figcaption><i class="punto luna"></i>Luna <i class="punto marte"></i>Marte</figcaption>
      </figure>
      <div class="barras">
        <h4>Similitud con ${NOMBRE_CUERPO[cuerpo]} por dimensión</h4>
        ${barras(activo)}
      </div>
    </div>

    <div class="columnas">
      <div>
        <h4>Dónde se parece</h4>
        <ul class="lista-dim">${lista(fuertes)}</ul>
      </div>
      <div>
        <h4>Dónde falla la analogía</h4>
        <ul class="lista-dim">${lista(debiles)}</ul>
        <p class="nota">Además, ningún sitio de la Tierra reproduce la gravedad, el vacío lunar,
        la atmósfera de Marte ni su radiación.</p>
      </div>
    </div>

    <h4>Qué se podría probar aquí</h4>
    <p>${esc(sitio.pruebas)}</p>

    <h4>Clima del sitio (NASA POWER, promedio anual)</h4>
    <table class="tabla-clima">
      <tr><th>Temp. media</th><td>${num(clima?.T2M)} °C</td><th>Mínima del año</th><td>${num(clima?.T2M_MIN)} °C</td></tr>
      <tr><th>Oscilación diaria</th><td>${num(clima?.T2M_RANGE)} °C</td><th>Lluvia</th><td>${num(clima?.PRECTOTCORR, 2)} mm/día</td></tr>
      <tr><th>Humedad</th><td>${num(clima?.RH2M, 0)} %</td><th>Viento</th><td>${num(clima?.WS10M)} m/s</td></tr>
      <tr><th>Elevación</th><td>${num(clima?.elev, 0)} m</td><th>Coordenadas</th><td>${sitio.lat}, ${sitio.lon}</td></tr>
    </table>

    <h4>Fuentes</h4>
    <ul class="fuentes">${fuentes}</ul>
  `;

  dibujarRadar(
    contenedor.querySelector("#radar"),
    [
      { cuerpo: "luna", dimensiones: luna.dimensiones },
      { cuerpo: "marte", dimensiones: marte.dimensiones },
    ],
    cuerpo
  );
}
