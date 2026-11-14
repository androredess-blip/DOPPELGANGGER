// Cálculo de similitud de cada sitio con la Luna y con Marte.
// Todo sale de data/modelo.json: si cambian un peso o un umbral ahí,
// la página se recalcula sola.

const limitar = (x) => Math.max(0, Math.min(1, x));

// Convierte un valor medido en un puntaje de 0 a 1.
// "min" es el valor que da 0 y "max" el que da 1 (pueden ir en cualquier orden).
function escalar(valor, min, max) {
  if (valor == null || Number.isNaN(valor)) return null;
  return limitar((valor - min) / (max - min));
}

function valorIndicador(clave, sitio, clima, modelo) {
  const ind = modelo.indicadores[clave];

  if (ind.tipo === "rasgo") {
    return sitio.rasgos[clave] ?? null;
  }
  if (ind.tipo === "geo") {
    return escalar(Math.abs(sitio.lat), ind.min, ind.max);
  }
  if (!clima) return null;
  return escalar(clima[ind.campo], ind.min, ind.max);
}

function promedio(valores) {
  const validos = valores.filter((v) => v != null);
  if (!validos.length) return null;
  return validos.reduce((a, b) => a + b, 0) / validos.length;
}

export function nivelDe(puntaje, modelo) {
  return modelo.niveles.find((n) => puntaje >= n.desde).nombre;
}

// Devuelve el puntaje total (0-100) y el de cada dimensión para un cuerpo ("luna" o "marte").
export function calcular(sitio, clima, modelo, cuerpo) {
  const pesos = modelo.pesos[cuerpo];
  const dimensiones = modelo.dimensiones.map((dim) => {
    const claves = dim[cuerpo];
    const valor = claves.length
      ? promedio(claves.map((c) => valorIndicador(c, sitio, clima, modelo)))
      : null;
    return { id: dim.id, nombre: dim.nombre, corto: dim.corto, valor, peso: pesos[dim.id] };
  });

  let suma = 0;
  let pesoUsado = 0;
  for (const d of dimensiones) {
    if (d.valor == null || !d.peso) continue;
    suma += d.valor * d.peso;
    pesoUsado += d.peso;
  }

  const total = pesoUsado ? Math.round((suma / pesoUsado) * 100) : 0;
  return { total, nivel: nivelDe(total, modelo), dimensiones };
}

// Ranking de todos los sitios para un cuerpo.
export function ranking(sitios, climaPorSitio, modelo, cuerpo) {
  return sitios
    .map((s) => ({ sitio: s, ...calcular(s, climaPorSitio[s.id], modelo, cuerpo) }))
    .sort((a, b) => b.total - a.total);
}

// Las dos dimensiones más fuertes y las dos más débiles (para la ficha).
export function fortalezasYDebilidades(resultado) {
  const aplican = resultado.dimensiones
    .filter((d) => d.valor != null && d.peso)
    .sort((a, b) => b.valor - a.valor);
  return {
    fuertes: aplican.slice(0, 2),
    debiles: aplican.slice(-2).reverse(),
  };
}
