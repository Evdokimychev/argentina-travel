/**
 * Compact point index derived from public/geo/map/national-parks.geojson.
 * It complements the detailed polygons so every park in the local APN/OSM snapshot
 * can be found as a pin without parsing the 5.6 MB geometry on every request.
 */
export const ARGENTINA_NATIONAL_PARK_POINTS = [
  { slug: "aconquija", name: "Parque Nacional Aconquija", latitude: -27.31199, longitude: -65.88099 },
  { slug: "baritu", name: "Parque Nacional Baritú", latitude: -22.58572, longitude: -64.62418 },
  { slug: "bosques-petrificados-de-jaramillo", name: "Parque Nacional Bosques Petrificados de Jaramillo", latitude: -47.67182, longitude: -68.0569 },
  { slug: "calilegua", name: "Parque Nacional Calilegua", latitude: -23.69497, longitude: -64.79297 },
  { slug: "campos-del-tuyu", name: "Parque Nacional Campos del Tuyú", latitude: -36.35784, longitude: -56.87242 },
  { slug: "chaco", name: "Parque Nacional Chaco", latitude: -26.82655, longitude: -59.65502 },
  { slug: "ciervo-de-los-pantanos", name: "Parque Nacional Ciervo de Los Pantanos", latitude: -34.23683, longitude: -58.84578 },
  { slug: "copo", name: "Parque Nacional Copo", latitude: -25.81468, longitude: -61.89389 },
  { slug: "el-impenetrable", name: "Parque Nacional El Impenetrable", latitude: -25.003, longitude: -61.09916 },
  { slug: "el-leoncito", name: "Parque Nacional El Leoncito", latitude: -31.90296, longitude: -69.25779 },
  { slug: "el-palmar", name: "Parque Nacional El Palmar", latitude: -31.87723, longitude: -58.25765 },
  { slug: "el-rey", name: "Parque Nacional El Rey", latitude: -24.67806, longitude: -64.63212 },
  { slug: "ibera", name: "Parque Nacional Iberá", latitude: -28.2692, longitude: -57.30545 },
  { slug: "iguazu", name: "Parque Nacional Iguazú", latitude: -25.64793, longitude: -54.31973 },
  { slug: "islas-de-santa-fe", name: "Parque Nacional Islas de Santa Fe", latitude: -32.27559, longitude: -60.74012 },
  { slug: "lago-puelo", name: "Parque Nacional Lago Puelo", latitude: -42.1764, longitude: -71.6902 },
  { slug: "laguna-blanca", name: "Parque Nacional Laguna Blanca", latitude: -39.05269, longitude: -70.33606 },
  { slug: "lanin", name: "Parque Nacional Lanín", latitude: -39.5716, longitude: -71.44965 },
  { slug: "lihue-calel", name: "Parque Nacional Lihué Calel", latitude: -37.9153, longitude: -65.56113 },
  { slug: "los-alerces", name: "Parque Nacional Los Alerces", latitude: -42.84215, longitude: -71.88659 },
  { slug: "los-arrayanes", name: "Parque Nacional Los Arrayanes", latitude: -40.82483, longitude: -71.62936 },
  { slug: "los-cardones", name: "Parque Nacional Los Cardones", latitude: -25.29738, longitude: -65.93122 },
  { slug: "los-glaciares", name: "Parque Nacional Los Glaciares", latitude: -49.97899, longitude: -73.13783 },
  { slug: "mburucuya", name: "Parque Nacional Mburucuyá", latitude: -28.0189, longitude: -58.07307 },
  { slug: "monte-leon", name: "Parque Nacional Monte León", latitude: -50.33721, longitude: -68.91746 },
  { slug: "nahuel-huapi", name: "Parque Nacional Nahuel Huapi", latitude: -40.86446, longitude: -71.5769 },
  { slug: "patagonia", name: "Parque Nacional Patagonia", latitude: -46.99723, longitude: -71.06165 },
  { slug: "perito-moreno", name: "Parque Nacional Perito Moreno", latitude: -47.92555, longitude: -72.2937 },
  { slug: "pre-delta", name: "Parque Nacional Pre-Delta", latitude: -32.1411, longitude: -60.64457 },
  { slug: "quebrada-del-condorito", name: "Parque Nacional Quebrada del Condorito", latitude: -31.66865, longitude: -64.77195 },
  { slug: "rio-pilcomayo", name: "Parque Nacional Río Pilcomayo", latitude: -25.05264, longitude: -58.14404 },
  { slug: "san-guillermo", name: "Parque Nacional San Guillermo", latitude: -29.25802, longitude: -69.27256 },
  { slug: "sierra-de-las-quijadas", name: "Parque Nacional Sierra de las Quijadas", latitude: -32.56649, longitude: -67.13356 },
  { slug: "talampaya", name: "Parque Nacional Talampaya", latitude: -29.89089, longitude: -67.97267 },
  { slug: "tierra-del-fuego", name: "Parque Nacional Tierra del Fuego", latitude: -54.65912, longitude: -68.48053 },
  { slug: "traslasierra", name: "Parque Nacional Traslasierra", latitude: -30.97591, longitude: -65.58642 },
] as const;

