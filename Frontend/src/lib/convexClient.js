const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";

export async function fetchConvexFunction(path, args = {}, type = "query") {
  try {
    const res = await fetch(`${CONVEX_URL}/${type}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Convex call ${path} failed with status ${res.status}`);
    }

    const json = await res.json();
    if (json.status === "error") {
      throw new Error(json.message || `Error in Convex call ${path}`);
    }

    return json.data;
  } catch (err) {
    console.error(`Convex client error (${path}):`, err);
    throw err;
  }
}

// Queries
export async function getAllSchemes() {
  return await fetchConvexFunction("schemes/getAllSchemes", {}, "query");
}

export async function getSchemeById(id) {
  return await fetchConvexFunction("schemes/getSchemeById", { id }, "query");
}

export async function getSchemesByChannelPartner(channel_partner_type, channel_partner_name) {
  return await fetchConvexFunction("schemes/getSchemesByChannelPartner", {
    channel_partner_type,
    channel_partner_name,
  }, "query");
}

export async function getSchemesByGovernmentType(government_type) {
  return await fetchConvexFunction("schemes/getSchemesByGovernmentType", { government_type }, "query");
}

export async function getAllChannelPartners() {
  return await fetchConvexFunction("channelPartners/getAllChannelPartners", {}, "query");
}

export async function getChannelPartnersByCategory(category) {
  return await fetchConvexFunction("channelPartners/getChannelPartnersByCategory", { category }, "query");
}

export async function getGroupedChannelPartners() {
  return await fetchConvexFunction("channelPartners/getGroupedChannelPartners", {}, "query");
}

// Server Actions (Sarvam NLU, Mappls Geolocation, Recommendation Pipeline)
export async function getRecommendations(profile = {}) {
  return await fetchConvexFunction("recommendations/getRecommendations", profile, "action");
}

export async function parseIntent(natural_text, language = "en", current_profile = {}) {
  return await fetchConvexFunction("sarvam/parseIntent", { natural_text, language, current_profile }, "action");
}

export async function translateText(text, source_lang = "ta", target_lang = "en") {
  return await fetchConvexFunction("sarvam/translateText", { text, source_lang, target_lang }, "action");
}

export async function getNearbyPartners(category = null, user_lat = null, user_lon = null, partner_name = null) {
  return await fetchConvexFunction("mappls/getNearbyPartners", { category, user_lat, user_lon, partner_name }, "action");
}

export async function geocodeAddress(address) {
  return await fetchConvexFunction("mappls/geocodeAddress", { address }, "action");
}

// Mutations
export async function saveUserProfile(profileData) {
  return await fetchConvexFunction("userProfiles/saveProfile", profileData, "action");
}

export async function submitApplication(applicationData) {
  return await fetchConvexFunction("applications/submitApplication", applicationData, "action");
}

export async function getApplicationByTrackingCode(tracking_code) {
  return await fetchConvexFunction("applications/getApplicationByTrackingCode", { tracking_code }, "query");
}
