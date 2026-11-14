// Mapa mundial con Leaflet (se carga desde index.html como variable global L).

let mapa;
let capa;

// Escala de azules: entre más parecido, más claro y más grande el punto.
function colorPara(total) {
  if (total >= 70) return "#9fd3ff";
  if (total >= 50) return "#4f9bf0";
  return "#2d5fb3";
}

export function crearMapa(idContenedor) {
  if (typeof L === "undefined") {
    document.getElementById(idContenedor).textContent =
      "No se pudo cargar el mapa. Revisa tu conexión a internet.";
    return;
  }
  mapa = L.map(idContenedor, { worldCopyJump: true, minZoom: 2 }).setView([20, 0], 2);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors",
      maxZoom: 12,
      maxNativeZoom: 16,
    }
  ).addTo(mapa);
  capa = L.layerGroup().addTo(mapa);
}

export function pintarSitios(resultados, seleccionado, alElegir) {
  if (!mapa) return;
  capa.clearLayers();

  for (const r of resultados) {
    const s = r.sitio;
    const activo = s.id === seleccionado;
    const marcador = L.circleMarker([s.lat, s.lon], {
      radius: 6 + r.total / 10,
      color: activo ? "#ffffff" : s.tipo === "candidato" ? "#ffd166" : "#c9d6ea",
      weight: activo ? 3 : 1.5,
      fillColor: colorPara(r.total),
      fillOpacity: 0.9,
    });
    marcador.bindTooltip(`${s.nombre} · ${r.total}`);
    marcador.on("click", () => alElegir(s.id));
    capa.addLayer(marcador);
  }
}

export function centrarEn(sitio) {
  if (mapa) mapa.flyTo([sitio.lat, sitio.lon], 5, { duration: 0.8 });
}
