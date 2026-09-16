"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header, Footer } from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { parseIntent } from "@/lib/convexClient";

function BusinessFormContent() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Normalize category from URL search params (e.g. ?type=Education or ?purpose=Education)
  const rawType = searchParams.get("type") || searchParams.get("purpose") || "Start a Business";
  
  let categoryKey = "Start a Business";
  if (rawType.toLowerCase().includes("edu")) {
    categoryKey = "Education";
  } else if (rawType.toLowerCase().includes("expand") || rawType.toLowerCase().includes("growth")) {
    categoryKey = "Expand My Business";
  } else if (rawType.toLowerCase().includes("other") || rawType.toLowerCase().includes("money")) {
    categoryKey = "Other Financial Need";
  }

  const [showGuidedForm, setShowGuidedForm] = useState(false);
  const [naturalText, setNaturalText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // Form field states for Guided Form / NLU extraction
  const [projectType, setProjectType] = useState("");
  const [expansionPurpose, setExpansionPurpose] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [socialCategory, setSocialCategory] = useState("");
  const [stateName, setStateName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getNaturalPlaceholder = () => {
    switch (categoryKey) {
      case "Education":
        return t("natural_ph_edu");
      case "Expand My Business":
        return t("natural_ph_growth");
      case "Other Financial Need":
        return t("natural_ph_money");
      default:
        return t("natural_ph_biz");
    }
  };

  const getFormHeading = () => {
    if (showGuidedForm) return t("guided_form_title");
    switch (categoryKey) {
      case "Education":
        return t("form_heading_edu");
      case "Expand My Business":
        return t("form_heading_growth");
      case "Other Financial Need":
        return t("form_heading_money");
      default:
        return t("form_heading_biz");
    }
  };

  const submitWithParams = (params) => {
    if (submitting) return;
    setSubmitting(true);

    const searchId = "s_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const queryParams = new URLSearchParams({
      purpose: params.purpose || categoryKey,
      project_type: params.project_type || "",
      project_cost: params.project_cost || "",
      annual_income: params.annual_income || "",
      category: params.category || "",
      state: params.state || "",
      query: params.query || naturalText.trim(),
      lang: lang,
      searchId: searchId,
    });
    router.push(`/recommendations?${queryParams.toString()}`);
  };

  // Primary Handler: Natural Language Intent Extraction & Submission
  const handleNaturalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (extracting || submitting) return;
    setErrorMsg("");

    if (!naturalText.trim()) {
      setErrorMsg(t("error_describe_need"));
      return;
    }

    // If already extracted and user has state, submit directly
    if (extractedData) {
      const finalState = stateName || extractedData.state_name;
      if (!finalState || !finalState.trim()) {
        setErrorMsg(t("error_select_state"));
        return;
      }
      submitWithParams({
        purpose: extractedData.purpose || categoryKey,
        project_type: projectType || extractedData.project_type || "",
        project_cost: projectCost || (extractedData.project_cost != null ? String(extractedData.project_cost) : ""),
        annual_income: annualIncome || (extractedData.annual_income != null ? String(extractedData.annual_income) : ""),
        category: socialCategory || extractedData.social_category || "",
        state: finalState.trim(),
        query: naturalText.trim(),
      });
      return;
    }

    setExtracting(true);
    try {
      const extracted = await parseIntent(naturalText.trim(), lang, { purpose: categoryKey });
      if (extracted) {
        setExtractedData(extracted);
        if (extracted.project_type) setProjectType(extracted.project_type);
        if (extracted.project_cost != null) setProjectCost(String(extracted.project_cost));
        if (extracted.annual_income != null) setAnnualIncome(String(extracted.annual_income));
        if (extracted.social_category) setSocialCategory(extracted.social_category);
        if (extracted.state_name) setStateName(extracted.state_name);

        // If state was present in text (e.g. "in Kerala"), submit immediately!
        if (extracted.state_name) {
          submitWithParams({
            purpose: extracted.purpose || categoryKey,
            project_type: extracted.project_type || "",
            project_cost: extracted.project_cost != null ? String(extracted.project_cost) : "",
            annual_income: extracted.annual_income != null ? String(extracted.annual_income) : "",
            category: extracted.social_category || "",
            state: extracted.state_name,
            query: naturalText.trim(),
          });
          return;
        }
      } else {
        setErrorMsg(t("error_nlu_failed"));
      }
    } catch (err) {
      console.error("NLU intent extraction error:", err);
      setErrorMsg(t("error_nlu_failed"));
    } finally {
      setExtracting(false);
    }
  };

  // Secondary Handler: Guided Category-Aware Structured Form Submission
  const handleGuidedSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!socialCategory) {
      setErrorMsg(t("error_select_category"));
      return;
    }

    const costNum = Number(projectCost);
    if (!projectCost || isNaN(costNum) || costNum <= 0) {
      setErrorMsg(t("error_valid_cost"));
      return;
    }

    const incomeNum = Number(annualIncome);
    if (annualIncome === "" || isNaN(incomeNum) || incomeNum < 0) {
      setErrorMsg(t("error_valid_income"));
      return;
    }

    if (!stateName.trim()) {
      setErrorMsg(t("error_valid_state"));
      return;
    }

    submitWithParams({
      purpose: categoryKey,
      project_type: projectType,
      project_cost: String(costNum),
      annual_income: String(incomeNum),
      category: socialCategory,
      state: stateName.trim(),
      query: naturalText.trim(),
    });
  };

  return (
    <div className="formbox" style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 28px" }}>
      <span className="badge" style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: "700" }}>
        {t("ai_badge")}
      </span>

      <h1 style={{ marginTop: "12px", marginBottom: "8px", fontSize: "28px", color: "#0f172a" }}>
        {getFormHeading()}
      </h1>

      <p className="muted" style={{ fontSize: "15px", lineHeight: "1.5", marginBottom: "24px", color: "#64748b" }}>
        {showGuidedForm ? t("guided_form_desc") : t("natural_form_desc")}
      </p>

      {errorMsg && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", color: "#991b1b", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* PRIMARY EXPERIENCE — NATURAL LANGUAGE AI TEXTAREA */}
      {!showGuidedForm ? (
        <form onSubmit={handleNaturalSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <textarea
              rows={4}
              value={naturalText}
              onChange={(e) => {
                setNaturalText(e.target.value);
                if (extractedData) setExtractedData(null);
              }}
              placeholder={getNaturalPlaceholder()}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "2px solid #3b82f6",
                fontSize: "15px",
                fontFamily: "inherit",
                lineHeight: "1.6",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.08)",
                outline: "none",
              }}
            />
          </div>

          {extracting ? (
            <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe", marginBottom: "20px" }}>
              <p style={{ margin: 0, color: "#1d4ed8", fontWeight: "600", fontSize: "15px" }}>
                🤖 {t("understanding_request")}
              </p>
            </div>
          ) : extractedData && !extractedData.state_name ? (
            <div style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f0f9ff", borderRadius: "12px", border: "1.5px solid #0284c7" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#0369a1", fontSize: "17px" }}>
                {t("here_is_what_understood")}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "14px", marginBottom: "16px" }}>
                <div>{t("business_project")}: <b>{projectType || extractedData.project_type || categoryKey}</b></div>
                <div>{t("amount")}: <b>₹{(Number(projectCost || extractedData.project_cost) || 0).toLocaleString()}</b></div>
                <div>{t("annual_income")}: <b>₹{(Number(annualIncome || extractedData.annual_income) || 0).toLocaleString()}</b></div>
                <div>{t("social_category")}: <b>{socialCategory || extractedData.social_category || "General"}</b></div>
              </div>

              <div style={{ borderTop: "1px solid #bae6fd", paddingTop: "14px", marginTop: "10px" }}>
                <label style={{ fontWeight: "700", color: "#0284c7", fontSize: "14px", display: "block", marginBottom: "6px" }}>
                  {t("state_prompt")}
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder={t("ph_state")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #0284c7", fontSize: "14px" }}
                />
              </div>
            </div>
          ) : null}

          {/* PRIMARY BUTTON */}
          <button
            type="submit"
            className="btn"
            disabled={extracting || submitting}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: (extracting || submitting) ? "not-allowed" : "pointer",
              backgroundColor: (extracting || submitting) ? "#93c5fd" : "#1877F2",
              color: "#ffffff",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(24, 119, 242, 0.25)",
              border: "none",
              marginBottom: "16px",
            }}
          >
            {extracting ? t("understanding_request") : submitting ? "..." : `${t("find_matching_btn")} →`}
          </button>

          {/* VISUAL SECONDARY BUTTON */}
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowGuidedForm(true)}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                color: "#334155",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
            >
              <span>✎</span> {t("enter_manually")}
            </button>
          </div>
        </form>
      ) : (
        /* SECONDARY EXPERIENCE — CATEGORY-AWARE GUIDED FORM */
        <form onSubmit={handleGuidedSubmit}>
          {/* CATEGORY A: START A BUSINESS */}
          {categoryKey === "Start a Business" && (
            <>
              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_biz_type")}</label>
                <input
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  placeholder={t("ph_biz_type")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_req_amount")}</label>
                <input
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder={t("ph_req_amount_biz")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_project_cost")}</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder={t("ph_project_cost")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </>
          )}

          {/* CATEGORY B: EDUCATION */}
          {categoryKey === "Education" && (
            <>
              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_edu_purpose")}</label>
                <input
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  placeholder={t("ph_edu_purpose")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_req_amount")}</label>
                <input
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder={t("ph_req_amount_edu")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </>
          )}

          {/* CATEGORY C: EXPAND MY BUSINESS */}
          {categoryKey === "Expand My Business" && (
            <>
              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_existing_biz")}</label>
                <input
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  placeholder={t("ph_existing_biz")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_expansion_purpose")}</label>
                <input
                  value={expansionPurpose}
                  onChange={(e) => setExpansionPurpose(e.target.value)}
                  placeholder={t("ph_expansion_purpose")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_req_amount")}</label>
                <input
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder={t("ph_req_amount_growth")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_expansion_cost")}</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder={t("ph_expansion_cost")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </>
          )}

          {/* CATEGORY D: OTHER FINANCIAL NEED */}
          {categoryKey === "Other Financial Need" && (
            <>
              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_other_need")}</label>
                <input
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  placeholder={t("ph_other_need")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_req_amount")}</label>
                <input
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                  placeholder={t("ph_req_amount_money")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </>
          )}

          {/* COMMON FIELDS FOR ALL CATEGORIES */}
          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_family_income")}</label>
            <input
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder={t("ph_family_income")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_social_category")}</label>
            <select
              value={socialCategory}
              onChange={(e) => setSocialCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", color: socialCategory === "" ? "#64748b" : "#0f172a" }}
            >
              <option value="" disabled>
                {t("ph_social_category")}
              </option>
              <option value="General">{t("cat_gen")}</option>
              <option value="Scheduled Caste (SC)">{t("cat_sc")}</option>
              <option value="Scheduled Tribe (ST)">{t("cat_st")}</option>
              <option value="Other Backward Class (OBC)">{t("cat_obc")}</option>
              <option value="EWS">{t("cat_ews")}</option>
              <option value="Minority">{t("cat_minority")}</option>
              <option value="Other">{t("cat_other")}</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("label_state")}</label>
            <input
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder={t("ph_state")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={submitting}
            style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "..." : `${t("find_matching_btn")} →`}
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => setShowGuidedForm(false)}
              style={{
                background: "none",
                border: "none",
                color: "#1877F2",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {t("back_to_natural")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <main className="formwrap">
        <Suspense fallback={<div className="formbox"><p className="muted">Loading form...</p></div>}>
          <BusinessFormContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}