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
  const initialType = searchParams.get("type") || "Start a Business";

  const [showGuidedForm, setShowGuidedForm] = useState(false);
  const [naturalText, setNaturalText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // Form field states (auto-filled by NLU or manual input)
  const [projectType, setProjectType] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [socialCategory, setSocialCategory] = useState("");
  const [stateName, setStateName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const submitWithParams = (params) => {
    const queryParams = new URLSearchParams({
      purpose: params.purpose || initialType,
      project_type: params.project_type || "",
      project_cost: params.project_cost || "",
      annual_income: params.annual_income || "",
      category: params.category || "",
      state: params.state || "",
      query: params.query || naturalText.trim(),
      lang: lang,
    });
    router.push(`/recommendations?${queryParams.toString()}`);
  };

  // Primary Handler: Natural Language Intent Extraction & Submission
  const handleNaturalSubmit = async (e) => {
    if (e) e.preventDefault();
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
        purpose: extractedData.purpose || initialType,
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
      const extracted = await parseIntent(naturalText.trim(), lang, { purpose: initialType });
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
            purpose: extracted.purpose || initialType,
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

  // Secondary Handler: Guided Structured Form Submission
  const handleGuidedSubmit = (e) => {
    e.preventDefault();
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
      purpose: initialType,
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
        {showGuidedForm ? t("guided_form_title") : t("natural_form_title")}
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
              placeholder={t("natural_input_ph")}
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
                <div>{t("business_project")}: <b>{projectType || extractedData.project_type || "Business"}</b></div>
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
                  placeholder="e.g. Kerala, Delhi, Karnataka"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #0284c7", fontSize: "14px" }}
                />
              </div>
            </div>
          ) : null}

          {/* PRIMARY BUTTON */}
          <button
            type="submit"
            className="btn"
            disabled={extracting}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: extracting ? "not-allowed" : "pointer",
              backgroundColor: extracting ? "#93c5fd" : "#1877F2",
              color: "#ffffff",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(24, 119, 242, 0.25)",
              border: "none",
              marginBottom: "16px",
            }}
          >
            {extracting ? t("understanding_request") : `${t("find_matching_btn")} →`}
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
        /* SECONDARY EXPERIENCE — GUIDED FORM */
        <form onSubmit={handleGuidedSubmit}>
          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("project_type_label")}</label>
            <input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. Chicken Shop, Salon, Dairy Farm"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("project_cost_label")}</label>
            <input
              type="number"
              value={projectCost}
              onChange={(e) => setProjectCost(e.target.value)}
              placeholder="₹ Enter amount (e.g. 250000)"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("family_income_label")}</label>
            <input
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="₹ Enter income (e.g. 150000)"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div className="field" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("social_category_label")}</label>
            <select
              value={socialCategory}
              onChange={(e) => setSocialCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", color: socialCategory === "" ? "#64748b" : "#0f172a" }}
            >
              <option value="" disabled>
                Select social category
              </option>
              <option value="General">{t("social_category_gen")}</option>
              <option value="Scheduled Caste (SC)">{t("social_category_sc")}</option>
              <option value="Scheduled Tribe (ST)">{t("social_category_st")}</option>
              <option value="Other Backward Class (OBC)">{t("social_category_obc")}</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="Minority">Minority</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "600", color: "#334155" }}>{t("state_label")}</label>
            <input
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="e.g. Kerala, Delhi, Karnataka"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button type="submit" className="btn" style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            {t("find_matching_btn")} →
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