"use client";

import { useEffect, useState, Suspense } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScheme() {
      setLoading(true);
      try {
        if (id && id !== "micro-finance" && id !== "term-loan") {
          const s = await getSchemeById(id);
          if (s) {
            setScheme(s);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch scheme by ID directly:", err.message);
      }

      // Fallback
      try {
        const allSchemes = await getAllSchemes();
        if (allSchemes && allSchemes.length > 0) {
          if (id === "micro-finance") {
            setScheme(allSchemes.find((s) => s.scheme_name.toLowerCase().includes("micro")) || allSchemes[0]);
          } else {
            setScheme(allSchemes[0]);
          }
        }
      } catch (e) {
        console.error("Failed fallback query from Convex:", e);
      }
      setLoading(false);
    }

    loadScheme();
  }, [id]);

  const name = scheme?.scheme_name || (id === "micro-finance" ? "Micro Finance Assistance" : "Term Loan Assistance");
  const govType = scheme?.government_type ? `${scheme.government_type} Government` : "Government of India";
  const channelPartner = scheme?.channel_partner_name ? `${scheme.channel_partner_name} (${scheme.channel_partner_type})` : "Authorized Channel Partner";
  const maxBenefit = scheme?.maximum_benefit || "As per applicable guidelines";
  const docsList = scheme?.documents_required && scheme.documents_required.length > 0 ? scheme.documents_required.join(", ") : "Required documents must be verified.";
  const descriptionText = scheme?.description && scheme.description.length > 0 ? scheme.description.join(" ") : "Suitable for eligible applicants seeking financial support.";

  return (
    <div className="container">
      <span className="badge">
        {t("scheme_details_title")} ({govType})
      </span>

      <h1>{name}</h1>

      <p className="muted">{descriptionText}</p>

      <div className="grid2">
        <div className="card">
          <h3>{t("eligibility_docs_title")}</h3>

          <p>
            <b>{t("documents")}:</b> {docsList}
          </p>

          <p style={{ marginTop: "8px" }}>
            <b>{t("channel_partner")}:</b> {channelPartner}
          </p>
        </div>

        <div className="card">
          <h3>{t("fin_support_title")}</h3>

          <p>
            <b>{t("max_benefit")}:</b> {maxBenefit}
          </p>

          <p style={{ marginTop: "8px" }}>
            Loan amount, financing percentage and interest depend on the applicable scheme and sanction terms.
          </p>
        </div>
      </div>

      <br />

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
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
    </div>
  );
}

export default function Scheme({ params }) {
  const [unwrappedParams, setUnwrappedParams] = useState(null);

  useEffect(() => {
    Promise.resolve(params).then((p) => setUnwrappedParams(p));
  }, [params]);

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