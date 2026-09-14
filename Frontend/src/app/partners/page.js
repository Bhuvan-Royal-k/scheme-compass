"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { getNearbyPartners, geocodeAddress } from "@/lib/convexClient";

export function buildMapplsDirectionsUrl(origin, destination) {
  if (!origin) return null;
  const originLat = origin.lat ?? origin.latitude;
  const originLng = origin.lng ?? origin.longitude;
  if (originLat == null || originLng == null) return null;

  if (!destination) return null;
  const destEloc = destination.eloc || destination.eLoc || destination.mapplsPin;
  const destLat = destination.lat ?? destination.latitude;
  const destLng = destination.lng ?? destination.longitude;

  if (destEloc) {
    return `https://mappls.com/direction?places=${originLat},${originLng};${destEloc}`;
  } else if (destLat != null && destLng != null) {
    return `https://mappls.com/direction?places=${originLat},${originLng};${destLat},${destLng}`;
  } else if (destination.navigation_url && destination.navigation_url.startsWith("https://mappls.com/")) {
    return destination.navigation_url;
  }
  return null;
}

function PartnersContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("type") || searchParams.get("category") || "ALL";
  const partnerName = searchParams.get("partner") || searchParams.get("name") || null;
  const initialQuery = searchParams.get("state") || searchParams.get("location") || searchParams.get("city") || "Karnataka";

  // Single active location state model
  const [activeLocation, setActiveLocation] = useState(null);
  const [manualLocationInput, setManualLocationInput] = useState(initialQuery);
  const [locStatus, setLocStatus] = useState("default"); // "default" | "detecting" | "success" | "denied" | "error"
  const [displayPartners, setDisplayPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  // Core search runner driven strictly by active search coordinates
  async function executeLocationSearch(queryText, overrideCategory = selectedCategory) {
    // 1. CLEAR OLD PARTNER RESULTS BEFORE REQUESTING NEW RESULTS
    setDisplayPartners([]);
    setErrorState(false);
    setLoading(true);

    try {
      // 2. Call Mappls geocoding action
      const geo = await geocodeAddress(queryText);

      if (geo && geo.latitude != null && geo.longitude != null) {
        const newLoc = {
          query: queryText,
          latitude: geo.latitude,
          longitude: geo.longitude,
          formattedAddress: geo.formatted_address || queryText,
        };

        // Store new active location (replaces previous location coordinates completely)
        setActiveLocation(newLoc);
        setLocStatus("success");

        // 3. Search Mappls nearby using the NEW coordinates
        const categoryArg = overrideCategory === "ALL" ? null : overrideCategory;
        const nearby = await getNearbyPartners(categoryArg, newLoc.latitude, newLoc.longitude, partnerName);

        setDisplayPartners(nearby || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Mappls geocoding / nearby partner discovery exception:", err.message);
      setErrorState(true);
    }

    setLoading(false);
  }

  // Initial load and query parameter changes
  useEffect(() => {
    executeLocationSearch(initialQuery);
  }, [selectedCategory, partnerName, initialQuery]);

  // Handler for browser geolocation
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("denied");
      return;
    }
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const gpsLoc = {
          query: "Current GPS Location",
          latitude: lat,
          longitude: lon,
          formattedAddress: `Current GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        };

        setDisplayPartners([]);
        setErrorState(false);
        setActiveLocation(gpsLoc);
        setLocStatus("success");
        setLoading(true);

        try {
          const categoryArg = selectedCategory === "ALL" ? null : selectedCategory;
          const nearby = await getNearbyPartners(categoryArg, lat, lon, partnerName);
          setDisplayPartners(nearby || []);
        } catch (err) {
          console.warn("Error fetching partners for GPS location:", err);
          setErrorState(true);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setLocStatus("denied");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handler for explicit manual location search (e.g. "Kochi, Kerala", "Delhi", "Bengaluru, Karnataka")
  const handleManualSearch = (e) => {
    e.preventDefault();
    const query = manualLocationInput.trim();
    if (!query) return;
    executeLocationSearch(query);
  };

  const categories = ["ALL", "PSB", "RRB", "SCA+bank/NBFC", "Gram Panchayat", "Post Office", "CSC/Govt counter"];

  return (
    <div className="container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* HEADER SECTION (Part 3) */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
          Find a Nearby Partner
        </h1>
        <p className="muted" style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
          Find the nearest physical branch or service point for this scheme.
        </p>
      </div>

      {/* LOCATION SEARCH BOX & STATUS (Part 2 & Part 3) */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div style={{ fontSize: "15px", color: "#0f172a" }}>
            📍 Searching near:{" "}
            <b style={{ color: "#1877F2", fontSize: "16px" }}>
              {locStatus === "success" && activeLocation?.query === "Current GPS Location"
                ? `Searching near your current location (${activeLocation.latitude.toFixed(4)}, ${activeLocation.longitude.toFixed(4)})`
                : activeLocation ? activeLocation.formattedAddress : manualLocationInput}
            </b>
          </div>

          <button
            onClick={handleUseLocation}
            type="button"
            style={{
              padding: "8px 16px",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {locStatus === "detecting" ? "Detecting GPS..." : "📍 Use Current Location"}
          </button>
        </div>

        {/* GPS DENIED ALERT (Part 2) */}
        {locStatus === "denied" && (
          <div style={{ padding: "10px 14px", backgroundColor: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "12px", fontSize: "14px", color: "#92400e", fontWeight: "500" }}>
            ⚠️ Location permission unavailable. Search by city or pincode below.
          </div>
        )}

        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={manualLocationInput}
            onChange={(e) => setManualLocationInput(e.target.value)}
            placeholder="Enter city, district or pincode (e.g. Kochi, Kerala, Delhi, Bengaluru)"
            style={{
              flex: "1",
              minWidth: "280px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            className="btn"
            style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer", backgroundColor: "#1877F2" }}
          >
            Search Location
          </button>
        </form>
      </div>

      {/* SECONDARY INSTITUTION FILTERS (Part 3) */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", marginBottom: "8px" }}>
          Filter by Institution Type
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => executeLocationSearch(activeLocation ? activeLocation.query : manualLocationInput, cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                backgroundColor: selectedCategory === cat ? "#0f172a" : "#f1f5f9",
                color: selectedCategory === cat ? "#ffffff" : "#475569",
                border: "1px solid #cbd5e1",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PARTNER CARDS RESPONSIVE GRID (Part 5, Part 7, Part 13) */}
      <div>
        {loading ? (
          <div style={{ padding: "50px 24px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <p className="muted" style={{ fontSize: "16px", fontWeight: "600", color: "#0284c7", margin: 0 }}>
              🔎 Searching Mappls nearby physical partner branches...
            </p>
          </div>
        ) : errorState ? (
          /* ERROR STATE (Part 14) */
          <div style={{ padding: "40px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "18px" }}>
              Unable to load nearby locations right now.
            </h3>
            <p style={{ margin: "0 0 16px 0", color: "#7f1d1d", fontSize: "14px" }}>
              Mappls location API encountered an error. Please try again.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => executeLocationSearch(activeLocation ? activeLocation.query : manualLocationInput)}
              style={{ padding: "10px 20px", fontSize: "14px", backgroundColor: "#dc2626", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        ) : displayPartners.length > 0 ? (
          /* PHYSICAL MAPPLS CARDS GRID (Part 5 & Part 13) */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {displayPartners.map((partner, index) => {
              // Single source of truth for Mappls Directions URL
              const originObj = activeLocation
                ? { lat: activeLocation.latitude, lng: activeLocation.longitude }
                : { lat: 13.010144812590655, lng: 77.67634092703894 };

              const directionsUrl = buildMapplsDirectionsUrl(originObj, partner);

              return (
                <div
                  className="card"
                  key={partner.id || partner._id || index}
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#1877F2", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {partner.name} · {partner.category}
                      </span>
                      {partner.distance_km != null && (
                        <span
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                          }}
                        >
                          📏 {partner.distance_km} km away
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: "4px 0 8px 0", color: "#0f172a", fontSize: "18px", lineHeight: "1.3" }}>
                      📍 {partner.branch_name || partner.name}
                    </h3>

                    {partner.address && (
                      <p style={{ margin: "0 0 16px 0", color: "#334155", fontSize: "13px", lineHeight: "1.5" }}>
                        {partner.address}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                      {partner.eloc ? `Mappls Pin: ${partner.eloc}` : "Verified Physical POI"}
                    </span>

                    {directionsUrl ? (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#1877F2",
                          color: "#ffffff",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Get Directions →
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        Mappls location unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE (Part 14) */
          <div style={{ padding: "40px 24px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontSize: "18px" }}>
              No nearby physical location found
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Try another city, district or pincode above.
            </p>
          </div>
        )}
      </div>

      <br />

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <Link className="btn" href="/find-scheme">
          {t("find_other_schemes")}
        </Link>
        <Link className="btn outline" href="/">
          {t("back_home")}
        </Link>
      </div>
    </div>
  );
}

export default function Partners() {
  return (
    <>
      <Header />
      <main className="section">
        <Suspense fallback={<div className="container" style={{ padding: "32px", textAlign: "center" }}><p className="muted">Loading nearby partner branches...</p></div>}>
          <PartnersContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}