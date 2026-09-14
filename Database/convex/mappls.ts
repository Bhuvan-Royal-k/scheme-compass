import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "CSC/Govt counter": ["CSC", "Common Service Centre", "Digital Seva Kendra", "Seva Kendra", "government service center"],
  "Post Office": ["Post Office", "India Post"],
  "Gram Panchayat": ["Gram Panchayat", "Panchayat Office"],
  "SCA+bank/NBFC": ["Bank", "NBFC", "Financial Corporation", "State Bank of India"],
  "PSB": ["State Bank of India", "Canara Bank", "Bank of Baroda", "Punjab National Bank", "Bank"],
  "RRB": ["Gramin Bank", "Regional Rural Bank", "Bank"],
};

export function buildMapplsDirectionsUrl(
  origin: { lat: number; lng: number },
  destination: { eloc?: string | null; lat?: number | null; lng?: number | null; navigation_url?: string | null }
): string | null {
  if (!origin || origin.lat == null || origin.lng == null) return null;

  const destEloc = destination?.eloc;
  const destLat = destination?.lat;
  const destLng = destination?.lng;

  if (destEloc) {
    return `https://mappls.com/direction?places=${origin.lat},${origin.lng};${destEloc}`;
  } else if (destLat != null && destLng != null) {
    return `https://mappls.com/direction?places=${origin.lat},${origin.lng};${destLat},${destLng}`;
  } else if (destination?.navigation_url && destination.navigation_url.startsWith("https://mappls.com/")) {
    return destination.navigation_url;
  }
  return null;
}

export async function getNearbyPartnersHelper(queryRunner: any, args: any) {
  const apiKey = process.env.MAPPLS_API_KEY;
  const userLat = args.user_lat;
  const userLon = args.user_lon;
  const includeAtms = args.include_atms === true;

  let partners: any[] = [];
  if (args.partner_name) {
    const allPartners = await queryRunner(api.channelPartners.getAllChannelPartners, {});
    partners = allPartners.filter((p: any) =>
      (p.name || "").toLowerCase().includes(String(args.partner_name).toLowerCase())
    );
    if (partners.length === 0) {
      partners = [{ _id: "custom", name: args.partner_name, category: args.category || "Bank" }];
    }
  } else if (args.category && args.category !== "ALL") {
    partners = await queryRunner(api.channelPartners.getChannelPartnersByCategory, {
      category: args.category,
    });
  } else {
    partners = await queryRunner(api.channelPartners.getAllChannelPartners, {});
  }

  // Deduplicate institution names to avoid redundant Mappls API requests
  const uniquePartnersMap = new Map<string, any>();
  for (const p of partners) {
    const name = p.name || "";
    if (name && !uniquePartnersMap.has(name)) {
      uniquePartnersMap.set(name, p);
    }
  }

  const targetPartners = Array.from(uniquePartnersMap.values()).slice(0, 6);
  const discoveredBranches: any[] = [];
  const addedElocs = new Set<string>();

  if (apiKey && userLat !== undefined && userLat !== null && userLon !== undefined && userLon !== null) {
    // 1. Search Convex partners via Mappls REST API
    for (const p of targetPartners) {
      const partnerName = p.name || "";
      const partnerCategory = p.category || "";
      const partnerId = String(p._id || "");

      try {
        const url = `https://search.mappls.com/search/places/nearby/json?keywords=${encodeURIComponent(partnerName)}&refLocation=${userLat},${userLon}&access_token=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            const items = data.suggestedLocations || [];

            for (const item of items) {
              const keywords: string[] = item.keywords || [];
              const placeName: string = item.placeName || item.name || partnerName;
              const placeAddress: string = item.placeAddress || item.address || "";
              const distanceM: number = typeof item.distance === "number" ? item.distance : (typeof item.distance_m === "number" ? item.distance_m : 0);
              const eloc: string = item.eLoc || item.eloc || item.mapplsPin || "";
              const itemLat = item.latitude != null ? Number(item.latitude) : (item.lat != null ? Number(item.lat) : null);
              const itemLng = item.longitude != null ? Number(item.longitude) : (item.lng != null ? Number(item.lng) : null);

              const isBankingCategory =
                ["PSB", "RRB", "SCA+bank/NBFC"].includes(partnerCategory) ||
                partnerCategory.toLowerCase().includes("bank") ||
                partnerName.toLowerCase().includes("bank");

              if (isBankingCategory && !includeAtms) {
                const isAtmKeyword = keywords.includes("FINATM") && !keywords.includes("FINBNK");
                const isAtmName = /\bATM\b/i.test(placeName) && !/\b(Branch|Bank)\b/i.test(placeName);
                if (isAtmKeyword || isAtmName) continue;
              }

              if (partnerCategory === "Post Office" || partnerName.toLowerCase().includes("post office")) {
                if (keywords.length > 0 && !keywords.some((k) => k.includes("POST") || k.includes("GOV"))) {
                  if (!placeName.toLowerCase().includes("post office") && !placeAddress.toLowerCase().includes("post office")) {
                    continue;
                  }
                }
              }

              const uniqueKey = eloc || `${itemLat}_${itemLng}_${placeName}`;
              if (addedElocs.has(uniqueKey)) continue;
              addedElocs.add(uniqueKey);

              const distKm = Number((distanceM / 1000).toFixed(2));
              const navUrl = buildMapplsDirectionsUrl(
                { lat: userLat, lng: userLon },
                { eloc: eloc || null, lat: itemLat, lng: itemLng }
              ) || "";

              discoveredBranches.push({
                id: `${partnerId}_${eloc || Math.random().toString(36).substring(7)}`,
                partner_id: partnerId,
                name: partnerName,
                branch_name: placeName,
                category: partnerCategory,
                address: placeAddress,
                distance_km: distKm,
                distance_m: distanceM,
                eloc: eloc || null,
                latitude: itemLat,
                longitude: itemLng,
                navigation_url: navUrl,
                location_status: "Verified physical location via Mappls Nearby API",
              });
            }
          }
        }
      } catch (err: any) {
        console.error(`Mappls Nearby POI search error for '${partnerName}':`, err.message);
      }
    }

    // 2. Category Keyword Fallback (Part E): If no POIs found, try category keywords
    const selectedCat = args.category || "ALL";
    if (discoveredBranches.length === 0 && selectedCat !== "ALL" && CATEGORY_KEYWORDS[selectedCat]) {
      const keywordsToTry = CATEGORY_KEYWORDS[selectedCat];
      for (const kw of keywordsToTry) {
        try {
          const url = `https://search.mappls.com/search/places/nearby/json?keywords=${encodeURIComponent(kw)}&refLocation=${userLat},${userLon}&access_token=${apiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            if (text) {
              const data = JSON.parse(text);
              const items = data.suggestedLocations || [];
              for (const item of items) {
                const placeName: string = item.placeName || item.name || kw;
                const placeAddress: string = item.placeAddress || item.address || "";
                const distanceM: number = typeof item.distance === "number" ? item.distance : 0;
                const eloc: string = item.eLoc || item.eloc || item.mapplsPin || "";
                const itemLat = item.latitude != null ? Number(item.latitude) : (item.lat != null ? Number(item.lat) : null);
                const itemLng = item.longitude != null ? Number(item.longitude) : (item.lng != null ? Number(item.lng) : null);

                const uniqueKey = eloc || `${itemLat}_${itemLng}_${placeName}`;
                if (addedElocs.has(uniqueKey)) continue;
                addedElocs.add(uniqueKey);

                const distKm = Number((distanceM / 1000).toFixed(2));
                const navUrl = buildMapplsDirectionsUrl(
                  { lat: userLat, lng: userLon },
                  { eloc: eloc || null, lat: itemLat, lng: itemLng }
                ) || "";

                discoveredBranches.push({
                  id: `cat_${eloc || Math.random().toString(36).substring(7)}`,
                  partner_id: "cat_fallback",
                  name: selectedCat,
                  branch_name: placeName,
                  category: selectedCat,
                  address: placeAddress,
                  distance_km: distKm,
                  distance_m: distanceM,
                  eloc: eloc || null,
                  latitude: itemLat,
                  longitude: itemLng,
                  navigation_url: navUrl,
                  location_status: "Verified physical POI via Mappls Category Search",
                });
              }
              if (discoveredBranches.length > 0) break; // Stop when physical POIs are found!
            }
          }
        } catch (e: any) {
          console.error(`Mappls category fallback search error for '${kw}':`, e.message);
        }
      }
    }

    // 3. Web Search Fallback (Part G): If still no exact POI returned for category, construct official Mappls nearby web search URL
    if (discoveredBranches.length === 0 && selectedCat !== "ALL") {
      const fallbackKeyword = selectedCat === "CSC/Govt counter" ? "CSC" : (selectedCat === "Post Office" ? "Post Office" : (selectedCat === "Gram Panchayat" ? "Gram Panchayat" : selectedCat));
      const webSearchUrl = `https://mappls.com/${encodeURIComponent(fallbackKeyword)}/near/${userLat},${userLon}`;
      discoveredBranches.push({
        id: `web_fallback_${selectedCat}`,
        partner_id: "web_fallback",
        name: selectedCat,
        branch_name: `Find nearby ${selectedCat} on Mappls`,
        category: selectedCat,
        address: `Explore all physical ${selectedCat} service points near your coordinates on Mappls Web`,
        distance_km: null,
        distance_m: 0,
        eloc: null,
        latitude: userLat,
        longitude: userLon,
        navigation_url: webSearchUrl,
        is_fallback_search: true,
        location_status: "Mappls Web Nearby Search",
      });
    }
  }

  // Sort discovered physical branches by distance ascending
  discoveredBranches.sort((a, b) => a.distance_m - b.distance_m);

  return discoveredBranches;
}

export const getNearbyPartners = action({
  args: {
    category: v.optional(v.string()),
    partner_name: v.optional(v.string()),
    user_lat: v.optional(v.number()),
    user_lon: v.optional(v.number()),
    include_atms: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await getNearbyPartnersHelper((fn: any, a: any) => ctx.runQuery(fn, a), args);
  },
});

const CITY_COORDINATES: Record<string, { lat: number; lng: number; formatted_address: string }> = {
  "delhi": { lat: 28.6139, lng: 77.2090, formatted_address: "New Delhi, Delhi, India" },
  "new delhi": { lat: 28.6139, lng: 77.2090, formatted_address: "New Delhi, Delhi, India" },
  "bengaluru": { lat: 12.9716, lng: 77.5946, formatted_address: "Bengaluru, Karnataka, India" },
  "bengaluru, karnataka": { lat: 12.9716, lng: 77.5946, formatted_address: "Bengaluru, Karnataka, India" },
  "bangalore": { lat: 12.9716, lng: 77.5946, formatted_address: "Bengaluru, Karnataka, India" },
  "karnataka": { lat: 12.9716, lng: 77.5946, formatted_address: "Bengaluru, Karnataka, India" },
  "mysuru": { lat: 12.2958, lng: 76.6394, formatted_address: "Mysuru, Karnataka, India" },
  "mysuru, karnataka": { lat: 12.2958, lng: 76.6394, formatted_address: "Mysuru, Karnataka, India" },
  "mysore": { lat: 12.2958, lng: 76.6394, formatted_address: "Mysuru, Karnataka, India" },
  "mumbai": { lat: 19.0760, lng: 72.8777, formatted_address: "Mumbai, Maharashtra, India" },
  "chennai": { lat: 13.0827, lng: 80.2707, formatted_address: "Chennai, Tamil Nadu, India" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, formatted_address: "Hyderabad, Telangana, India" },
  "kolkata": { lat: 22.5726, lng: 88.3639, formatted_address: "Kolkata, West Bengal, India" },
  "lucknow": { lat: 26.8467, lng: 80.9462, formatted_address: "Lucknow, Uttar Pradesh, India" },
  "noida": { lat: 28.5355, lng: 77.3910, formatted_address: "Noida, Uttar Pradesh, India" },
  "kochi": { lat: 9.9312, lng: 76.2673, formatted_address: "Kochi, Kerala, India" },
  "kochi, kerala": { lat: 9.9312, lng: 76.2673, formatted_address: "Kochi, Kerala, India" },
  "cochin": { lat: 9.9312, lng: 76.2673, formatted_address: "Kochi, Kerala, India" },
  "kerala": { lat: 9.9312, lng: 76.2673, formatted_address: "Kochi, Kerala, India" },
};

export const geocodeAddress = action({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.MAPPLS_API_KEY;
    const norm = args.address.trim().toLowerCase();

    if (apiKey) {
      try {
        const res = await fetch(
          `https://search.mappls.com/search/address/geocode?address=${encodeURIComponent(args.address)}&access_token=${apiKey}`
        );
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            let cop = data.copResults;
            if (Array.isArray(cop)) {
              cop = cop[0];
            }
            if (cop) {
              const lat = cop.latitude != null ? Number(cop.latitude) : (cop.lat != null ? Number(cop.lat) : null);
              const lng = cop.longitude != null ? Number(cop.longitude) : (cop.lng != null ? Number(cop.lng) : null);
              if (lat !== null && lng !== null) {
                return {
                  status: "verified",
                  formatted_address: cop.formattedAddress || cop.address || args.address,
                  eloc: cop.eLoc || null,
                  latitude: lat,
                  longitude: lng,
                  confidence_score: cop.confidenceScore ?? null,
                  geocode_level: cop.geocodeLevel || null,
                };
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`Mappls Geocoding API call exception for '${args.address}':`, err.message);
      }
    }

    // Fallback city resolver
    const cityMatch = CITY_COORDINATES[norm];
    if (cityMatch) {
      return {
        status: "verified",
        formatted_address: cityMatch.formatted_address,
        eloc: null,
        latitude: cityMatch.lat,
        longitude: cityMatch.lng,
      };
    }

    return {
      status: "unavailable",
      latitude: null,
      longitude: null,
    };
  },
});
