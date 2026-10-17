/**
 * Where Ghormu is: the village centre as Google Maps places it. Used for the
 * weather forecast and for directions links. The village's own location only,
 * never a household's.
 */
export const ghormu = {
  latitude: 28.0135648,
  longitude: 85.2525557,
  timeZone: "Asia/Kathmandu",
} as const

const coords = `${ghormu.latitude},${ghormu.longitude}`

/** Directions from wherever the visitor is, computed by Google Maps. */
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords}`

export const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${ghormu.latitude}&mlon=${ghormu.longitude}#map=14/${ghormu.latitude}/${ghormu.longitude}`
