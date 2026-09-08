/**
 * Haversine formula to calculate the distance between two coordinates in kilometers or miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'miles' | 'km' = 'miles'
): number {
  const R = unit === 'miles' ? 3958.8 : 6371; // Radius of the Earth
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Reverse geocode latitude and longitude to a human-readable address/landmark
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RestaurantOrderingSystem/1.0',
        },
      }
    );

    if (!response.ok) {
      return `Near (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    }

    const data = await response.json();
    if (data && data.address) {
      const parts = [];
      if (data.address.amenity || data.address.building || data.address.shop) {
        parts.push(data.address.amenity || data.address.building || data.address.shop);
      }
      if (data.address.road || data.address.pedestrian) {
        parts.push(data.address.road || data.address.pedestrian);
      }
      if (data.address.neighbourhood || data.address.suburb) {
        parts.push(data.address.neighbourhood || data.address.suburb);
      }
      if (parts.length > 0) {
        return parts.join(', ');
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 2).join(',');
      }
    }
    return `Near outdoor area (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `Near outdoor patio/entrance (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  }
}
