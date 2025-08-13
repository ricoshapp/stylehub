export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("search");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const UA = { "User-Agent": "StyleHub/0.1 (dev)" };

  // Forward geocode (text search)
  if (q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: UA, cache: "no-store" });
    const data = await res.json();
    return Response.json(data);
  }

  // Reverse geocode (lat/lng -> city/state/postcode)
  if (lat && lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;
    const res = await fetch(url, { headers: UA, cache: "no-store" });
    const data = await res.json();
    const addr = data?.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.county || "San Diego";
    const state = addr.state || "CA";
    const postalCode = addr.postcode || "";
    return Response.json({ city, state, postalCode });
  }

  return new Response("Missing params", { status: 400 });
}
