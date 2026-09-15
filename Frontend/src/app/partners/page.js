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
  const destName = destination.branch_name || destination.name || "";

  if (destLat != null && destLng != null) {
    const nameParam = destName ? `,${encodeURIComponent(destName)}` : "";
    return `https://mappls.com/navigation?places=${destLat},${destLng}${nameParam}&isNav=true&mode=driving`;
  } else if (destEloc) {
    return `https://mappls.com/direction?places=${originLat},${originLng};${destEloc}`;
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
  const [locStatus, setLocStatus] = useState("default");
  const [displayPartners, setDisplayPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  async function executeLocationSearch(queryText, overrideCategory = selectedCategory) {
    setDisplayPartners([]);
    setErrorState(false);
    setLoading(true);

    try {
      const geo = await geocodeAddress(queryText);

      if (geo && geo.latitude != null && geo.longitude != null) {
        const newLoc = {
          query: queryText,
          latitude: geo.latitude,
          longitude: geo.longitude,
          formattedAddress: geo.formatted_address || queryText,
        };

        setActiveLocation(newLoc);
        setLocStatus("success");

        const categoryArg = overrideCategory === "ALL" ? null : overrideCategory;
        const nearby = await getNearbyPartners(categoryArg, newLoc.latitude, newLoc.longitude, partnerName);

        setDisplayPartners(nearby || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Geocoding / nearby partner discovery error:", err.message);
      setErrorState(true);
    }

    setLoading(false);
  }

  useEffect(() => {
    executeLocationSearch(initialQuery);
  }, [selectedCategory, partnerName, initialQuery]);

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

  const handleManualSearch = (e) => {
    e.preventDefault();
    const query = manualLocationInput.trim();
    if (!query) return;
    executeLocationSearch(query);
  };

  const categories = ["ALL", "PSB", "RRB", "SCA+bank/NBFC", "Gram Panchayat", "Post Office", "CSC/Govt counter"];

  return (
    <div className="container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* HEADER SECTION */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
          {t("partners_title")}
        </h1>
        <p className="muted" style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
          {t("partners_sub")}
        </p>
      </div>

      {/* LOCATION SEARCH BOX */}
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
            {t("searching_near")}{" "}
            <b style={{ color: "#1877F2", fontSize: "16px" }}>
              {locStatus === "success" && activeLocation?.query === "Current GPS Location"
                ? `Searching near your location (${activeLocation.latitude.toFixed(4)}, ${activeLocation.longitude.toFixed(4)})`
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
            {locStatus === "detecting" ? t("getting_location") : t("use_current_location")}
          </button>
        </div>

        {locStatus === "denied" && (
          <div style={{ padding: "10px 14px", backgroundColor: "#fef3c7", borderRadius: "8px", border: "1px solid #fde68a", marginBottom: "12px", fontSize: "14px", color: "#92400e", fontWeight: "500" }}>
            ⚠️ {t("location_denied")}
          </div>
        )}

        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={manualLocationInput}
            onChange={(e) => setManualLocationInput(e.target.value)}
            placeholder={t("enter_location_ph")}
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
            {t("search_location")}
          </button>
        </form>
      </div>

      {/* INSTITUTION FILTERS */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", marginBottom: "8px" }}>
          {t("filter_by_institution")}
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

      {/* PARTNER CARDS */}
      <div>
        {loading ? (
          <div style={{ padding: "50px 24px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <p className="muted" style={{ fontSize: "16px", fontWeight: "600", color: "#0284c7", margin: 0 }}>
              🔎 Searching nearby physical partner branches...
            </p>
          </div>
        ) : errorState ? (
          <div style={{ padding: "40px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "18px" }}>
              Unable to load nearby locations right now.
            </h3>
            <p style={{ margin: "0 0 16px 0", color: "#7f1d1d", fontSize: "14px" }}>
              Location service encountered an error. Please try again.
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "20px",
            }}
          >
            {displayPartners.map((partner, index) => {
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
                          📏 {partner.distance_km} {t("distance_away")}
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
                      {partner.eloc ? `${t("mappls_pin")}: ${partner.eloc}` : "Verified Physical POI"}
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
                        {t("get_directions")}
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        Location unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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