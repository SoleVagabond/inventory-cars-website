// Simple helpers to decode VIN and fetch recalls from NHTSA
const BASE_DECODER = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/';
const BASE_RECALLS = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

export async function decodeVin(vin: string) {
  const res = await fetch(`${BASE_DECODER}${encodeURIComponent(vin)}?format=json`);
  if (!res.ok) throw new Error('VIN decode failed');
  const json = await res.json();
  return json?.Results?.[0] ?? null;
}

export async function getRecalls(make: string, model: string, year: number) {
  const u = new URL(BASE_RECALLS);
  u.searchParams.set('make', make);
  u.searchParams.set('model', model);
  u.searchParams.set('modelYear', String(year));
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error('Recall fetch failed');
  return res.json();
}
