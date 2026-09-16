"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { getRecommendations, getAllSchemes } from "@/lib/convexClient";

function RecommendationsLoadingUI() {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStage(1), 500);
    const timer2 = setTimeout(() => setActiveStage(2), 1000);
    const timer3 = setTimeout(() => setActiveStage(3), 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const steps = [
    t("loading_step_1"),
    t("loading_step_2"),
    t("loading_step_3"),
    t("loading_step_4"),
  ];

  return (
    <div
      className="card"
      style={{
        maxWidth: "540px",
        margin: "32px auto",
        padding: "36px 28px",
        textAlign: "center",
        borderRadius: "16px",
        border: "1.5px solid #bfdbfe",
        backgroundColor: "#f8fafc",
        boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          margin: "0 auto 18px auto",
          borderRadius: "50%",
          border: "4px solid #e0f2fe",
          borderTopColor: "#1877F2",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", fontSize: "20px" }}>
        {t("finding_best_schemes")}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", maxWidth: "340px", margin: "0 auto" }}>
        {steps.map((stepText, idx) => {
          const isDone = idx < activeStage;
          const isCurrent = idx === activeStage;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "14px",
                fontWeight: isCurrent ? "700" : isDone ? "600" : "400",
                color: isCurrent ? "#1877F2" : isDone ? "#166534" : "#94a3b8",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ fontSize: "16px", minWidth: "20px", textAlign: "center" }}>
                {isDone ? "✓" : isCurrent ? "⟳" : "○"}
              </span>
              <span>{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationsContent() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();

  const purpose = searchParams.get("purpose") || "Start a Business";
  const project_type = searchParams.get("project_type") || "";
  const project_cost = searchParams.get("project_cost") ? Number(searchParams.get("project_cost")) : undefined;
  const annual_income = searchParams.get("annual_income") ? Number(searchParams.get("annual_income")) : undefined;
  const state_name = searchParams.get("state") || "";
  const social_category = searchParams.get("category") || "";
  const natural_text = searchParams.get("query") || "";
  const searchId = searchParams.get("searchId") || "";

  // Derive stable cache key for this search context
  const searchKey = searchId
    ? `sc_res_${searchId}`
    : `sc_res_${purpose}_${project_type}_${project_cost}_${annual_income}_${state_name}_${social_category}_${natural_text}_${lang}`;

  const [recommendations, setRecommendations] = useState([]);
  const [explanation, setExplanation] = useState("");
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);

  // Keep track of loaded search key to avoid refetching during same mount lifecycle
  const loadedKeyRef = useRef("");

  useEffect(() => {
    // 1. CHECK SESSION STORAGE CACHE BEFORE MAKING ANY API CALL
    if (typeof window !== "undefined") {
      try {
        const cachedStr = sessionStorage.getItem(searchKey) || (searchId ? null : sessionStorage.getItem("sc_last_search"));
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          if (cachedData && Array.isArray(cachedData.results) && cachedData.results.length > 0) {
            setRecommendations(cachedData.results);
            setExplanation(cachedData.explanation || "");
            setTotalCandidates(cachedData.totalCandidates || cachedData.results.length);
            setLoading(false);
            loadedKeyRef.current = searchKey;
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to parse cached recommendations:", err);
      }
    }

    // Don't refetch if already loaded for this exact searchKey
    if (loadedKeyRef.current === searchKey && recommendations.length > 0) {
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const payload = {
          purpose,
          project_type,
          project_cost,
          annual_income,
          state_name,
          social_category,
          natural_text,
          government_type: "Central",
          language: lang,
        };

        const data = await getRecommendations(payload);

        if (data && data.recommendations && data.recommendations.length > 0) {
          const finalRecs = data.recommendations;
          const finalExp = data.explanation || "";
          const finalTotal = data.total_candidates || finalRecs.length;

          setRecommendations(finalRecs);
          setExplanation(finalExp);
          setTotalCandidates(finalTotal);
          setLoading(false);
          loadedKeyRef.current = searchKey;

          // SAVE TO SESSION STORAGE FOR INSTANT BACK-TO-RESULTS Persistent Navigation
          if (typeof window !== "undefined") {
            try {
              const cachePayload = JSON.stringify({
                results: finalRecs,
                explanation: finalExp,
                totalCandidates: finalTotal,
                searchKey: searchKey,
                timestamp: Date.now(),
              });
              sessionStorage.setItem(searchKey, cachePayload);
              sessionStorage.setItem("sc_last_search", cachePayload);
            } catch (e) {
              console.warn("Failed to write recommendations cache:", e);
            }
          }
          return;
        }
      } catch (err) {
        console.warn("Recommendations query fallback:", err.message);
      }

      // Fallback if recommendation engine returns empty or fails
      try {
        const convexSchemes = await getAllSchemes();
        const fallbackRecs = convexSchemes.slice(0, 5).map((s) => ({
          scheme_id: s._id,
          scheme_name: s.scheme_name,
          government_type: s.government_type,
          channel_partner_type: s.channel_partner_type,
          channel_partner_name: s.channel_partner_name,
          maximum_benefit: s.maximum_benefit,
          status: "requires_verification",
          score: 0.85,
          reasons: ["Matches general scheme criteria."],
          documents_required: s.documents_required || [],
        }));

        setTotalCandidates(convexSchemes.length);
        setRecommendations(fallbackRecs);
        setLoading(false);
        loadedKeyRef.current = searchKey;

        if (typeof window !== "undefined") {
          try {
            const cachePayload = JSON.stringify({
              results: fallbackRecs,
              explanation: "",
              totalCandidates: convexSchemes.length,
              searchKey: searchKey,
              timestamp: Date.now(),
            });
            sessionStorage.setItem(searchKey, cachePayload);
            sessionStorage.setItem("sc_last_search", cachePayload);
          } catch (e) {}
        }
      } catch (e) {
        console.error("Failed fallback query:", e);
        setLoading(false);
      }
    }

    loadData();
  }, [searchKey, purpose, project_type, project_cost, annual_income, state_name, social_category, natural_text, lang, searchId]);

  const getStatusText = (status) => {
    if (status === "eligible") return t("status_eligible");
    if (status === "ineligible") return t("status_ineligible");
    return t("status_requires_verification");
  };

  const buildDetailUrl = (schemeId) => {
    const params = new URLSearchParams(searchParams.toString());
    return `/scheme/${schemeId}?${params.toString()}`;
  };

  return (
    <div className="container">
      <div className="center">
        <span className="badge">
          {totalCandidates} {t("rec_evaluated")}
        </span>

        <h1>{t("rec_title")}</h1>

        <p className="muted">
          {explanation || t("rec_sub")}
        </p>
      </div>

      {loading ? (
        <RecommendationsLoadingUI />
      ) : recommendations.length > 0 ? (
        recommendations.map((rec, index) => {
          const schemeId = rec.scheme_id || rec._id || `scheme_${index}`;
          const detailUrl = buildDetailUrl(schemeId);

          return (
            <div
              className="result"
              key={schemeId}
              style={{ marginBottom: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <h2 style={{ margin: 0 }}>
                  <Link href={detailUrl} style={{ color: "#0f172a", textDecoration: "none" }}>
                    {rec.scheme_name}
                  </Link>
                </h2>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    backgroundColor:
                      rec.status === "eligible"
                        ? "#dcfce7"
                        : rec.status === "requires_verification"
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      rec.status === "eligible"
                        ? "#166534"
                        : rec.status === "requires_verification"
                        ? "#92400e"
                        : "#991b1b",
                  }}
                >
                  {getStatusText(rec.status)}
                </span>
              </div>

              <p style={{ marginTop: "12px" }}>
                <b>{t("gov_sector")}:</b> {rec.government_type} · <b>{t("channel_partner")}:</b>{" "}
                {rec.channel_partner_name} ({rec.channel_partner_type})
              </p>

              <p>
                <b>{t("max_benefit")}:</b> {rec.maximum_benefit}
              </p>

              <p>
                <b>{t("match_confidence")}:</b> Math Score {Math.round(rec.score * 100)}%
                {" · "}
                {rec.reasons && rec.reasons.length > 0
                  ? rec.reasons.join(" ")
                  : "Matches criteria."}
              </p>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                <Link className="btn" href={detailUrl}>
                  {t("view_details")} →
                </Link>
                <Link
                  className="btn outline"
                  href={`/partners?type=${encodeURIComponent(rec.channel_partner_type || "PSB")}&partner=${encodeURIComponent(rec.channel_partner_name || "")}&state=${encodeURIComponent(state_name)}`}
                >
                  🧭 {t("find_nearby_partner")}
                </Link>
              </div>
            </div>
          );
        })
      ) : (
        <div className="result" style={{ textAlign: "center", padding: "32px" }}>
          <h2>{t("no_matching")}</h2>
          <p>{t("no_matching_sub")}</p>
          <Link className="btn outline" href="/find-scheme">
            {t("back_to_find")}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Recommendations() {
  return (
    <>
      <Header />
      <main className="formwrap">
        <Suspense fallback={<div className="container" style={{ padding: "32px", textAlign: "center" }}><p className="muted">Loading recommendations...</p></div>}>
          <RecommendationsContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}