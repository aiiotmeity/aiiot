// Utility functions for distance calculation and formatting
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // returns distance in kilometers
}

export function formatDistance(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return '—';
  // Always display in kilometers for consistency across the app.
  // Use one decimal place to match previous UI formatting (e.g. "0.1 km" or "1.2 km").
  return `${distanceKm.toFixed(1)} km`;
}

export default { calculateDistance, formatDistance };
