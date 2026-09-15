"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { getSchemeById, getAllSchemes } from "@/lib/convexClient";

function SchemeContent({ id }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const state_name = searchParams.get("state") || "";

  const [scheme, setScheme] = useState(null);
  const [otherSchemes, setOtherSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchemeData() {
      setLoading(true);
      try {
        if (id && id !== "micro-finance" && id !== "term-loan") {
          const s = await getSchemeById(id);
          if (s) {
            setScheme(s);
          }
        }
      } catch (err) {
        console.warn("Could not fetch scheme by ID directly:", err.message);
      }

      try {
        const allSchemes = await getAllSchemes();
        if (allSchemes && allSchemes.length > 0) {
          if (!scheme) {
            if (id === "micro-finance") {
              setScheme(allSchemes.find((s) => s.scheme_name.toLowerCase().includes("micro")) || allSchemes[0]);
            } else {
              const matched = allSchemes.find((s) => s._id === id);
              setScheme(matched || allSchemes[0]);
            }
          }
          // Filter 3-4 other schemes for related schemes navigation
          const related = allSchemes.filter((s) => s._id !== id).slice(0, 3);
          setOtherSchemes(related);
        }
      } catch (e) {
        console.error("Failed fallback query from Convex:", e);
      }
      setLoading(false);
    }

    loadSchemeData();
  }, [id]);

  const name = scheme?.scheme_name || (id === "micro-finance" ? "Micro Finance Assistance" : "Government Scheme Assistance");
  const govType = scheme?.government_type ? `${scheme.government_type} Government` : "Government of India";
  const channelPartner = scheme?.channel_partner_name ? `${scheme.channel_partner_name} (${scheme.channel_partner_type})` : "Authorized Channel Partner";
  const maxBenefit = scheme?.maximum_benefit || "As per applicable guidelines";
  const docsList = scheme?.documents_required && scheme.documents_required.length > 0 ? scheme.documents_required.join(", ") : "Required documents must be verified.";
  const descriptionText = scheme?.description && scheme.description.length > 0 ? scheme.description.join(" ") : "Suitable for eligible applicants seeking financial support.";

  const backUrl = searchParams.toString() ? `/recommendations?${searchParams.toString()}` : "/find-scheme";

  return (
    <div className="container" style={{ maxWidth: "960px", margin: "0 auto" }}>
      {/* BREADCRUMB / BACK LINK */}
      <div style={{ marginBottom: "16px" }}>
        <Link href={backUrl} style={{ color: "#1877F2", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
          {t("back_to_results")}
        </Link>
      </div>

      <span className="badge">
        {t("scheme_details_title")} ({govType})
      </span>

      <h1 style={{ color: "#0f172a", fontSize: "32px", marginTop: "8px", marginBottom: "12px" }}>{name}</h1>

      <p className="muted" style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>{descriptionText}</p>

      <div className="grid2" style={{ gap: "20px" }}>
        <div className="card" style={{ padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>{t("eligibility_docs_title")}</h3>

          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <b>{t("documents")}:</b> {docsList}
          </p>

          <p style={{ marginTop: "12px", fontSize: "14px" }}>
            <b>{t("channel_partner")}:</b> {channelPartner}
          </p>
        </div>

        <div className="card" style={{ padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>{t("fin_support_title")}</h3>

          <p style={{ fontSize: "14px" }}>
            <b>{t("max_benefit")}:</b> {maxBenefit}
          </p>

          <p style={{ marginTop: "12px", fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
            Loan amount, financing percentage and interest depend on the applicable scheme and sanction terms.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "24px" }}>
        <Link className="btn" href="/calculator">
          {t("estimate_emi")} →
        </Link>
        <Link
          className="btn outline"
          href={`/partners?type=${encodeURIComponent(scheme?.channel_partner_type || "PSB")}&partner=${encodeURIComponent(scheme?.channel_partner_name || "")}&state=${encodeURIComponent(state_name)}`}
        >
          🧭 {t("find_nearby_partner")} →
        </Link>
      </div>

      {/* SCHEME-TO-SCHEME DIRECT NAVIGATION (PARTNERS & RELATED SCHEMES) */}
      {otherSchemes.length > 0 && (
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
          <h3 style={{ color: "#0f172a", fontSize: "20px", marginBottom: "16px" }}>
            {t("related_schemes")}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {otherSchemes.map((other) => {
              const relUrl = `/scheme/${other._id}?${searchParams.toString()}`;
              return (
                <div
                  key={other._id}
                  className="card"
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase" }}>
                      {other.government_type} Government
                    </span>
                    <h4 style={{ margin: "6px 0 8px 0", color: "#0f172a", fontSize: "16px" }}>
                      {other.scheme_name}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Max Benefit: {other.maximum_benefit}
                    </p>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <Link className="btn outline" href={relUrl} style={{ fontSize: "12px", padding: "6px 12px" }}>
                      {t("view_details")} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Scheme({ params }) {
  const unwrappedParams = use(params);

  return (
    <>
      <Header />
      <main className="section">
        <Suspense fallback={<div className="container" style={{ padding: "32px", textAlign: "center" }}><p className="muted">Loading scheme details...</p></div>}>
          {unwrappedParams?.id && <SchemeContent id={unwrappedParams.id} />}
        </Suspense>
      </main>
      <Footer />
    </>
  );
}