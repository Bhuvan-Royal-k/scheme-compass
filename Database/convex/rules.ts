export interface UserProfileData {
  purpose?: string;
  project_type?: string;
  project_cost?: number;
  annual_income?: number;
  social_category?: string;
  gender?: string;
  age?: number;
  state_name?: string;
  loan_required?: boolean;
  government_type?: string;
  channel_partner_type?: string;
  natural_text?: string;
  language?: string;
}

export interface EligibilityResultData {
  scheme_id: string;
  scheme_name: string;
  government_type: string;
  channel_partner_type: string;
  channel_partner_name: string;
  maximum_benefit: string;
  status: "eligible" | "ineligible" | "requires_verification";
  score: number;
  reasons: string[];
  documents_required: string[];
  state_name?: string;
}

export function evaluateScheme(scheme: any, profile: UserProfileData): EligibilityResultData {
  const reasons: string[] = [];
  let score = 0.5;
  let isIneligible = false;

  const schemeId = String(scheme._id || "");
  const schemeName = String(scheme.scheme_name || "");
  const govType = String(scheme.government_type || "");
  const cpType = String(scheme.channel_partner_type || "");
  const cpName = String(scheme.channel_partner_name || "");
  const maxBenefit = String(scheme.maximum_benefit || "");
  const fundStatus = String(scheme.fund_availability_status || "");
  const schemeState = scheme.state_name;
  const docsRequired: string[] = scheme.documents_required || [];
  const description: string[] = scheme.description || [];

  // Combined text representation for rule and compatibility checking
  const combinedText = (description.join(" ") + " " + schemeName + " " + maxBenefit).toLowerCase();

  // Rule 1: Fund Availability
  if (["unavailable", "closed", "exhausted"].includes(fundStatus.toLowerCase())) {
    isIneligible = true;
    reasons.push("Funds for this scheme are currently marked unavailable.");
  }

  // Rule 2: State applicability
  if (schemeState && profile.state_name) {
    const normSchemeState = schemeState.trim().toLowerCase();
    const normProfileState = profile.state_name.trim().toLowerCase();
    if (normSchemeState === normProfileState) {
      score += 0.2;
      reasons.push(`Applicable to resident state: ${schemeState}.`);
    } else {
      isIneligible = true;
      reasons.push(`Scheme is restricted to state: '${schemeState}' (Applicant state: '${profile.state_name}').`);
    }
  } else if (govType.trim().toLowerCase() === "central") {
    score += 0.15;
    reasons.push("Central Government scheme applicable pan-India.");
  }

  // Rule 3: Preferred Government Sector
  if (profile.government_type) {
    if (profile.government_type.trim().toLowerCase() === govType.trim().toLowerCase()) {
      score += 0.1;
      reasons.push(`Matches preferred government sector (${govType}).`);
    }
  }

  // Rule 4: Preferred Channel Partner Category
  if (profile.channel_partner_type) {
    if (profile.channel_partner_type.trim().toLowerCase() === cpType.trim().toLowerCase()) {
      score += 0.15;
      reasons.push(`Offered via preferred channel partner category: ${cpType}.`);
    }
  }

  // Rule 5: User Intent & Scheme Purpose Compatibility Classifier
  const reqPurpose = (profile.purpose || "").toLowerCase();
  const reqNatural = (profile.natural_text || "").toLowerCase();
  const reqProjectType = (profile.project_type || "").toLowerCase();
  const fullReqText = `${reqPurpose} ${reqProjectType} ${reqNatural}`.toLowerCase();

  const isEduRequest =
    reqPurpose.includes("education") ||
    fullReqText.includes("education") ||
    fullReqText.includes("student") ||
    fullReqText.includes("btec") ||
    fullReqText.includes("course") ||
    fullReqText.includes("tuition") ||
    fullReqText.includes("college") ||
    fullReqText.includes("university");

  const isBizRequest =
    reqPurpose.includes("business") ||
    fullReqText.includes("business") ||
    fullReqText.includes("salon") ||
    fullReqText.includes("startup") ||
    fullReqText.includes("enterprise") ||
    fullReqText.includes("retail") ||
    fullReqText.includes("shop") ||
    fullReqText.includes("manufacturing");

  // Scheme Type Detection
  const isSavingsScheme =
    combinedText.includes("savings account") ||
    combinedText.includes("deposit account") ||
    combinedText.includes("sukanya") ||
    combinedText.includes("girl child") ||
    combinedText.includes("pension") ||
    combinedText.includes("life insurance") ||
    combinedText.includes("accidental death") ||
    combinedText.includes("fixed deposit");

  const isEduLoanScheme =
    combinedText.includes("education loan") ||
    combinedText.includes("student loan") ||
    combinedText.includes("higher education") ||
    combinedText.includes("scholarship") ||
    combinedText.includes("tuition") ||
    combinedText.includes("study loan") ||
    combinedText.includes("educational assistance");

  const isBizLoanScheme =
    combinedText.includes("business loan") ||
    combinedText.includes("mudra") ||
    combinedText.includes("stand-up india") ||
    combinedText.includes("pmegp") ||
    combinedText.includes("micro-finance") ||
    combinedText.includes("working capital") ||
    combinedText.includes("enterprise loan");

  // Compatibility Rule Application
  let hasPurposeMismatch = false;

  if (isEduRequest) {
    if (isSavingsScheme && !isEduLoanScheme) {
      hasPurposeMismatch = true;
      score -= 0.65;
      reasons.push("Scheme is a long-term savings/account scheme, not an active education loan/financing scheme.");
    } else if (isEduLoanScheme) {
      score += 0.35;
      reasons.push("Matches education loan/scholarship financing objective.");
    }
  }

  if (isBizRequest) {
    if (isSavingsScheme || (isEduLoanScheme && !isBizLoanScheme)) {
      hasPurposeMismatch = true;
      score -= 0.5;
      reasons.push("Scheme is for savings/education, not business financing.");
    } else if (isBizLoanScheme) {
      score += 0.35;
      reasons.push("Matches business financing objective.");
    }
  }

  // Rule 6: Project Cost / Amount Compatibility Check
  let hasMinAmountMismatch = false;
  if (profile.project_cost && profile.project_cost > 0) {
    const cost = profile.project_cost;

    // Minimum threshold check (e.g., Stand-Up India requiring ₹10 Lakhs minimum)
    if (/\b(10|ten)\s*lakhs?\s*to\b/i.test(combinedText) || /\bminimum\s*project\s*cost\s*:\s*10\b/i.test(combinedText)) {
      const minThreshold = 1000000; // ₹10,00,000 (10 Lakhs)
      if (cost < minThreshold) {
        hasMinAmountMismatch = true;
        score -= 0.35;
        reasons.push(`Requested project cost (₹${cost.toLocaleString("en-IN")}) is below the scheme's minimum funding threshold of ₹10 Lakhs.`);
      }
    }

    // Maximum cap check (e.g. Micro-finance capped at ₹50,000 or ₹2 Lakhs)
    if (/\bup\s*to\s*₹?50,000\b/i.test(combinedText) || /\bmicro-finance\s*loan\s*up\s*to\s*₹?50,000\b/i.test(combinedText)) {
      const maxCap = 50000;
      if (cost > maxCap * 4) {
        score -= 0.25;
        reasons.push(`Requested amount (₹${cost.toLocaleString("en-IN")}) exceeds the micro-finance scheme maximum cap of ₹50,000.`);
      }
    }
  }

  // Social Category / Beneficiary restriction detection in scheme text
  const categoryTerms = [
    "sc", "st", "obc", "scheduled caste", "scheduled tribe", "minority",
    "women", "woman", "female", "men", "man", "male", "disabled", "handicapped", "pwd",
    "divyang", "specially abled", "differently abled", "transgender",
    "veteran", "ex-servicemen", "ex-serviceman", "artisan", "weaver", "backward class",
    "community", "caste", "tribe"
  ];
  const hasCategoryRestriction = categoryTerms.some((term) =>
    new RegExp(`\\b${term}\\b`, "i").test(combinedText)
  );

  let finalStatus: "eligible" | "ineligible" | "requires_verification";
  let finalScore: number;

  if (isIneligible) {
    finalStatus = "ineligible";
    finalScore = Math.max(0.0, score - 0.5);
  } else {
    if (docsRequired.length > 0 || hasCategoryRestriction || hasMinAmountMismatch || hasPurposeMismatch) {
      finalStatus = "requires_verification";
      if (docsRequired.length > 0) {
        reasons.push(`Requires document verification (${docsRequired.length} document(s) needed).`);
      }
      if (hasCategoryRestriction) {
        reasons.push("Requires applicant social category/beneficiary eligibility verification.");
      }
      if (hasMinAmountMismatch) {
        reasons.push("Project cost is below the scheme's minimum funding range.");
      }
      if (hasPurposeMismatch) {
        reasons.push("Scheme category differs from stated financing request.");
      }
    } else {
      finalStatus = "eligible";
      reasons.push("Meets all basic scheme criteria.");
    }
    finalScore = Math.min(1.0, Math.max(0.1, score));
  }

  return {
    scheme_id: schemeId,
    scheme_name: schemeName,
    government_type: govType,
    channel_partner_type: cpType,
    channel_partner_name: cpName,
    maximum_benefit: maxBenefit,
    status: finalStatus,
    score: Number(finalScore.toFixed(2)),
    reasons,
    documents_required: docsRequired,
    state_name: schemeState,
  };
}
