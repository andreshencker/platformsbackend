// Convierte segundos/ms/ISO a ms. Devuelve undefined si es inválido.
export function toMs(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  // numérico (string o number)
  const n = Number(value);
  if (Number.isFinite(n)) {
    // si es menor a 1e12 probablemente son segundos -> pasa a ms
    return n < 1e12 ? Math.trunc(n * 1000) : Math.trunc(n);
  }

  // ISO u otras fechas parseables
  const t = new Date(value).valueOf();
  return Number.isFinite(t) ? t : undefined;
}

// Validación mínima: año 2000 en ms
export const MIN_MS = 946684800000;