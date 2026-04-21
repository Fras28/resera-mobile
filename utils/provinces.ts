/**
 * Argentine province centroids (approximate geographic center).
 * Used for proximity-based sorting in the marketplace.
 */
export const PROVINCE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'CABA':              { lat: -34.6037, lng: -58.3816 },
  'Buenos Aires':      { lat: -36.6769, lng: -60.5588 },
  'Catamarca':         { lat: -28.4696, lng: -65.7852 },
  'Chaco':             { lat: -27.4514, lng: -59.0730 },
  'Chubut':            { lat: -43.2930, lng: -65.1023 },
  'Córdoba':           { lat: -31.4135, lng: -64.1811 },
  'Corrientes':        { lat: -27.4692, lng: -58.8306 },
  'Entre Ríos':        { lat: -31.7748, lng: -60.4956 },
  'Formosa':           { lat: -24.8948, lng: -59.7979 },
  'Jujuy':             { lat: -24.1858, lng: -65.2996 },
  'La Pampa':          { lat: -37.1315, lng: -65.4408 },
  'La Rioja':          { lat: -29.4130, lng: -66.8560 },
  'Mendoza':           { lat: -34.6430, lng: -68.1274 },
  'Misiones':          { lat: -27.4269, lng: -55.9450 },
  'Neuquén':           { lat: -38.9516, lng: -68.0591 },
  'Río Negro':         { lat: -40.8135, lng: -63.0034 },
  'Salta':             { lat: -24.7883, lng: -65.4116 },
  'San Juan':          { lat: -30.8653, lng: -68.8894 },
  'San Luis':          { lat: -33.2950, lng: -66.3356 },
  'Santa Cruz':        { lat: -51.6230, lng: -69.2182 },
  'Santa Fe':          { lat: -30.7069, lng: -60.9498 },
  'Santiago del Estero': { lat: -27.7834, lng: -64.2643 },
  'Tierra del Fuego':  { lat: -54.0000, lng: -67.0000 },
  'Tucumán':           { lat: -26.8241, lng: -65.2226 },
};

/** Ordered list: CABA + Buenos Aires first, then alphabetically */
export const PROVINCES: string[] = [
  'CABA',
  'Buenos Aires',
  ...Object.keys(PROVINCE_CENTROIDS)
    .filter((p) => p !== 'CABA' && p !== 'Buenos Aires')
    .sort((a, b) => a.localeCompare(b, 'es')),
];

/**
 * Haversine distance between two province centroids, in km.
 * Returns 0 if either province is unknown.
 */
export function distanceBetweenProvinces(prov1: string, prov2: string): number {
  const c1 = PROVINCE_CENTROIDS[prov1];
  const c2 = PROVINCE_CENTROIDS[prov2];
  if (!c1 || !c2) return 0;

  const R  = 6371; // km
  const dLat = toRad(c2.lat - c1.lat);
  const dLng = toRad(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Human-readable label for a distance.
 * 0 km → "Tu provincia"
 * < 1000 km → "~Xkm"
 * >= 1000 km → "~X,Xk km"
 */
export function distanceLabel(km: number): string {
  if (km === 0) return 'Tu provincia';
  if (km < 1000) return `~${km} km`;
  return `~${(km / 1000).toFixed(1).replace('.', ',')}k km`;
}
