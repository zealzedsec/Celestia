// Celestia — offline world gazetteer: major cities with coordinates and IANA time zones.
// Used for instant search, and as the fallback when the online geocoder is unreachable.

export interface City {
  name: string
  country: string
  lat: number
  lon: number
  tz: string
}

export const WORLD_CITIES: City[] = [
  // Africa
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  { name: 'Durban', country: 'South Africa', lat: -29.8587, lon: 31.0218, tz: 'Africa/Johannesburg' },
  { name: 'Pretoria', country: 'South Africa', lat: -25.7479, lon: 28.2293, tz: 'Africa/Johannesburg' },
  { name: 'Gqeberha', country: 'South Africa', lat: -33.9608, lon: 25.6022, tz: 'Africa/Johannesburg' },
  { name: 'Windhoek', country: 'Namibia', lat: -22.5609, lon: 17.0658, tz: 'Africa/Windhoek' },
  { name: 'Gaborone', country: 'Botswana', lat: -24.6282, lon: 25.9231, tz: 'Africa/Gaborone' },
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lon: 31.0335, tz: 'Africa/Harare' },
  { name: 'Lusaka', country: 'Zambia', lat: -15.3875, lon: 28.3228, tz: 'Africa/Lusaka' },
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lon: 32.5732, tz: 'Africa/Maputo' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.03, lon: 38.74, tz: 'Africa/Addis_Ababa' },
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lon: 39.2083, tz: 'Africa/Dar_es_Salaam' },
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lon: 32.5825, tz: 'Africa/Kampala' },
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.4419, lon: 15.2663, tz: 'Africa/Kinshasa' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lon: -0.187, tz: 'Africa/Accra' },
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lon: -17.4677, tz: 'Africa/Dakar' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898, tz: 'Africa/Casablanca' },
  { name: 'Marrakesh', country: 'Morocco', lat: 31.6295, lon: -7.9811, tz: 'Africa/Casablanca' },
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lon: 3.0588, tz: 'Africa/Algiers' },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lon: 10.1815, tz: 'Africa/Tunis' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { name: 'Luxor', country: 'Egypt', lat: 25.6872, lon: 32.6396, tz: 'Africa/Cairo' },
  // Europe
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lon: -3.1883, tz: 'Europe/London' },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
  { name: 'Glastonbury', country: 'United Kingdom', lat: 51.1489, lon: -2.7148, tz: 'Europe/London' },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' },
  { name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon' },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { name: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686, tz: 'Europe/Madrid' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'Lyon', country: 'France', lat: 45.764, lon: 4.8357, tz: 'Europe/Paris' },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lon: 4.3517, tz: 'Europe/Brussels' },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lon: 11.582, tz: 'Europe/Berlin' },
  { name: 'Hamburg', country: 'Germany', lat: 53.5511, lon: 9.9937, tz: 'Europe/Berlin' },
  { name: 'Zürich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, tz: 'Europe/Zurich' },
  { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lon: 6.1432, tz: 'Europe/Zurich' },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738, tz: 'Europe/Vienna' },
  { name: 'Prague', country: 'Czechia', lat: 50.0755, lon: 14.4378, tz: 'Europe/Prague' },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122, tz: 'Europe/Warsaw' },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402, tz: 'Europe/Budapest' },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
  { name: 'Milan', country: 'Italy', lat: 45.4642, lon: 9.19, tz: 'Europe/Rome' },
  { name: 'Florence', country: 'Italy', lat: 43.7696, lon: 11.2558, tz: 'Europe/Rome' },
  { name: 'Venice', country: 'Italy', lat: 45.4408, lon: 12.3155, tz: 'Europe/Rome' },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens' },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { name: 'Bucharest', country: 'Romania', lat: 44.4268, lon: 26.1025, tz: 'Europe/Bucharest' },
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lon: 30.5234, tz: 'Europe/Kyiv' },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'Saint Petersburg', country: 'Russia', lat: 59.9311, lon: 30.3609, tz: 'Europe/Moscow' },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686, tz: 'Europe/Stockholm' },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  { name: 'Tromsø', country: 'Norway', lat: 69.6492, lon: 18.9553, tz: 'Europe/Oslo' },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683, tz: 'Europe/Copenhagen' },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384, tz: 'Europe/Helsinki' },
  // Middle East & Asia
  { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lon: 35.2137, tz: 'Asia/Jerusalem' },
  { name: 'Beirut', country: 'Lebanon', lat: 33.8938, lon: 35.5018, tz: 'Asia/Beirut' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  { name: 'Mecca', country: 'Saudi Arabia', lat: 21.3891, lon: 39.8579, tz: 'Asia/Riyadh' },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran' },
  { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lon: 44.3661, tz: 'Asia/Baghdad' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lon: 74.3587, tz: 'Asia/Karachi' },
  { name: 'Delhi', country: 'India', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  { name: 'Mumbai', country: 'India', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  { name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { name: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { name: 'Varanasi', country: 'India', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata' },
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lon: 79.8612, tz: 'Asia/Colombo' },
  { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0278, lon: 105.8342, tz: 'Asia/Bangkok' },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  { name: 'Bali (Denpasar)', country: 'Indonesia', lat: -8.6705, lon: 115.2126, tz: 'Asia/Makassar' },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842, tz: 'Asia/Manila' },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { name: 'Taipei', country: 'Taiwan', lat: 25.033, lon: 121.5654, tz: 'Asia/Taipei' },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo' },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lon: 135.7681, tz: 'Asia/Tokyo' },
  { name: 'Ulaanbaatar', country: 'Mongolia', lat: 47.8864, lon: 106.9057, tz: 'Asia/Ulaanbaatar' },
  { name: 'Almaty', country: 'Kazakhstan', lat: 43.222, lon: 76.8512, tz: 'Asia/Almaty' },
  { name: 'Tashkent', country: 'Uzbekistan', lat: 41.2995, lon: 69.2401, tz: 'Asia/Tashkent' },
  { name: 'Novosibirsk', country: 'Russia', lat: 55.0084, lon: 82.9357, tz: 'Asia/Novosibirsk' },
  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251, tz: 'Australia/Brisbane' },
  { name: 'Adelaide', country: 'Australia', lat: -34.9285, lon: 138.6007, tz: 'Australia/Adelaide' },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth' },
  { name: 'Darwin', country: 'Australia', lat: -12.4634, lon: 130.8456, tz: 'Australia/Darwin' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2865, lon: 174.7762, tz: 'Pacific/Auckland' },
  { name: 'Suva', country: 'Fiji', lat: -18.1248, lon: 178.4501, tz: 'Pacific/Fiji' },
  { name: 'Honolulu', country: 'United States', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
  // Americas
  { name: 'Anchorage', country: 'United States', lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver' },
  { name: 'Seattle', country: 'United States', lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Las Vegas', country: 'United States', lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
  { name: 'Phoenix', country: 'United States', lat: 33.4484, lon: -112.074, tz: 'America/Phoenix' },
  { name: 'Sedona', country: 'United States', lat: 34.8697, lon: -111.761, tz: 'America/Phoenix' },
  { name: 'Denver', country: 'United States', lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
  { name: 'Calgary', country: 'Canada', lat: 51.0447, lon: -114.0719, tz: 'America/Edmonton' },
  { name: 'Dallas', country: 'United States', lat: 32.7767, lon: -96.797, tz: 'America/Chicago' },
  { name: 'Houston', country: 'United States', lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { name: 'New Orleans', country: 'United States', lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { name: 'Atlanta', country: 'United States', lat: 33.749, lon: -84.388, tz: 'America/New_York' },
  { name: 'Miami', country: 'United States', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  { name: 'Washington, D.C.', country: 'United States', lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { name: 'Boston', country: 'United States', lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'Montréal', country: 'Canada', lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lon: -82.3666, tz: 'America/Havana' },
  { name: 'San Juan', country: 'Puerto Rico', lat: 18.4655, lon: -66.1057, tz: 'America/Puerto_Rico' },
  { name: 'Bogotá', country: 'Colombia', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lon: -66.9036, tz: 'America/Caracas' },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  { name: 'Cusco', country: 'Peru', lat: -13.532, lon: -71.9675, tz: 'America/Lima' },
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lon: -78.4678, tz: 'America/Guayaquil' },
  { name: 'La Paz', country: 'Bolivia', lat: -16.4897, lon: -68.1193, tz: 'America/La_Paz' },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lon: -56.1645, tz: 'America/Montevideo' },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo' },
  { name: 'Brasília', country: 'Brazil', lat: -15.7975, lon: -47.8919, tz: 'America/Sao_Paulo' },
  { name: 'Manaus', country: 'Brazil', lat: -3.119, lon: -60.0217, tz: 'America/Manaus' },
  // Polar & remote observatories
  { name: 'Longyearbyen', country: 'Svalbard', lat: 78.2232, lon: 15.6267, tz: 'Arctic/Longyearbyen' },
  { name: 'Mauna Kea', country: 'United States', lat: 19.8207, lon: -155.4681, tz: 'Pacific/Honolulu' },
  { name: 'Atacama (San Pedro)', country: 'Chile', lat: -22.9087, lon: -68.1997, tz: 'America/Santiago' },
  { name: 'Sutherland (SALT)', country: 'South Africa', lat: -32.3783, lon: 20.8107, tz: 'Africa/Johannesburg' },
]

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Accent-insensitive prefix/substring search; prefix matches rank first */
export function searchCities(query: string, limit = 8): City[] {
  const q = fold(query.trim())
  if (q.length < 2) return []
  const scored: { c: City; score: number }[] = []
  for (const c of WORLD_CITIES) {
    const name = fold(c.name)
    const country = fold(c.country)
    let score = -1
    if (name.startsWith(q)) score = 3
    else if (name.split(/[\s(,]+/).some((w) => w.startsWith(q))) score = 2
    else if (name.includes(q)) score = 1
    else if (country.startsWith(q)) score = 0.5
    if (score >= 0) scored.push({ c, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name)).slice(0, limit).map((x) => x.c)
}
