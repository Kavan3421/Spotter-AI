/**
 * API client for Spotter AI Commercial Logistics and HOS Engine.
 */
const BASE_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

export async function planTrip(tripData) {
  const response = await fetch(`${BASE_URL}/api/plan-trip/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tripData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || `API request failed with status ${response.status}`);
  }

  return await response.json();
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health/`, { method: 'GET' });
    return response.ok;
  } catch (err) {
    return false;
  }
}
