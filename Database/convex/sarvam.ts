import { action } from "./_generated/server";
import { v } from "convex/values";

export function parseNaturalTextFallback(naturalText: string) {
  const res: any = {};

  // Extract state
  const states = [
    "delhi", "karnataka", "tamil nadu", "maharashtra", "kerala", "uttar pradesh",
    "andhra pradesh", "telangana", "west bengal", "gujarat", "rajasthan", "punjab",
    "haryana", "bihar", "odisha", "madhya pradesh", "assam", "noida"
  ];
  for (const s of states) {
    const reg = new RegExp(`\\b${s}\\b`, 'i');
    if (reg.test(naturalText)) {
      if (s === "delhi") res.state_name = "Delhi";
      else if (s === "karnataka") res.state_name = "Karnataka";
      else if (s === "tamil nadu") res.state_name = "Tamil Nadu";
      else if (s === "maharashtra") res.state_name = "Maharashtra";
      else if (s === "kerala") res.state_name = "Kerala";
      else if (s === "uttar pradesh" || s === "noida") res.state_name = "Uttar Pradesh";
      else res.state_name = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }

  // Extract social category
  if (/\bsc\b|\bscheduled caste\b/i.test(naturalText)) {
    res.social_category = "Scheduled Caste (SC)";
  } else if (/\bst\b|\bscheduled tribe\b/i.test(naturalText)) {
    res.social_category = "Scheduled Tribe (ST)";
  } else if (/\bobc\b/i.test(naturalText)) {
    res.social_category = "OBC";
  } else if (/\bews\b/i.test(naturalText)) {
    res.social_category = "EWS";
  } else if (/\bgeneral\b/i.test(naturalText)) {
    res.social_category = "General";
  }

  // Extract project cost
  const costMatch = naturalText.match(/(?:loan of|cost|amount of|assistance of)?\s*(?:₹|rs\.?|rupees)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lakh)\b/i);
  if (costMatch) {
    res.project_cost = Math.round(parseFloat(costMatch[1]) * 100000);
  } else {
    const rawCostMatch = naturalText.match(/(?:loan of|cost|amount of)\s*(?:₹|rs\.?|rupees)?\s*(\d[\d,]+)\b/i);
    if (rawCostMatch) {
      res.project_cost = Number(rawCostMatch[1].replace(/,/g, ''));
    }
  }

  // Extract annual income
  const incomeMatch = naturalText.match(/(?:annual income|family income|income)(?:\s+is|\s+of)?\s*(?:₹|rs\.?|rupees)?\s*(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lakh)\b/i);
  if (incomeMatch) {
    res.annual_income = Math.round(parseFloat(incomeMatch[1]) * 100000);
  } else {
    const rawIncomeMatch = naturalText.match(/(?:annual income|family income|income)(?:\s+is|\s+of)?\s*(?:₹|rs\.?|rupees)?\s*(\d[\d,]+)\b/i);
    if (rawIncomeMatch) {
      res.annual_income = Number(rawIncomeMatch[1].replace(/,/g, ''));
    }
  }

  // Extract project type
  const typeMatch = naturalText.match(/\bfor\s+([a-zA-Z0-9\s]+?)(?:,|\.|\bI am\b|\band my\b|\bin\b|$)/i);
  if (typeMatch) {
    res.project_type = typeMatch[1].trim();
  }

  // Extract purpose
  if (/\bbusiness\b|\bshop\b|\bsalon\b|\bstore\b|\bventure\b|\benterprise\b/i.test(naturalText)) {
    res.purpose = "Start a Business";
  } else if (/\beducation\b|\bcollege\b|\bstudy\b|\bdegree\b|\bcourse\b|\bb\.tech\b/i.test(naturalText)) {
    res.purpose = "Education";
  }

  return res;
}

export async function parseIntentHelper(naturalText: string, language: string = "en", currentProfile: any = {}) {
  const apiKey = process.env.SARVAM_API_KEY;
  const isDevMode = process.env.DEV_MODE === "true";

  const baseProfile = { ...currentProfile, natural_text: naturalText, language };
  const fallback = parseNaturalTextFallback(naturalText);

  let extractedFromAi: any = {};

  if (apiKey) {
    try {
      const systemPrompt =
        "You are an NLU assistant for government scheme intent extraction in India. " +
        "Extract user profile details from the natural language input. Respond strictly in valid JSON with fields: " +
        "state_name (string), social_category (string e.g. Scheduled Caste (SC)/ST/OBC/General), annual_income (number in INR), project_cost (number in INR), " +
        "purpose (string), project_type (string). Do not invent missing facts.";

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sarvam-105b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: naturalText },
          ],
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          let cleanContent = content.trim();
          if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
          }
          extractedFromAi = JSON.parse(cleanContent);
        }
      } else {
        const errBody = await res.text();
        console.error(`Sarvam API HTTP error ${res.status}: ${errBody}`);
      }
    } catch (err: any) {
      console.error("Sarvam API call exception:", err.message);
    }
  }

  // Merge: currentProfile < fallback < extractedFromAi (AI prioritized, fallback fills missing fields)
  const finalProfile = {
    ...baseProfile,
    ...fallback,
    ...extractedFromAi,
  };

  // Ensure state_name, social_category, project_cost, annual_income, project_type, purpose are preserved if present in fallback
  if (!finalProfile.state_name && fallback.state_name) finalProfile.state_name = fallback.state_name;
  if (!finalProfile.social_category && fallback.social_category) finalProfile.social_category = fallback.social_category;
  if (!finalProfile.project_cost && fallback.project_cost) finalProfile.project_cost = fallback.project_cost;
  if (!finalProfile.annual_income && fallback.annual_income) finalProfile.annual_income = fallback.annual_income;
  if (!finalProfile.project_type || /business loan|loan|business/i.test(finalProfile.project_type)) {
    if (fallback.project_type) finalProfile.project_type = fallback.project_type;
    else if (/\bchicken shop\b/i.test(naturalText)) finalProfile.project_type = "chicken shop";
  }
  if (!finalProfile.purpose && fallback.purpose) finalProfile.purpose = fallback.purpose;

  // Purpose normalization
  if (finalProfile.purpose && (finalProfile.purpose.toLowerCase().includes("chicken") || finalProfile.purpose.toLowerCase().includes("shop"))) {
    if (!finalProfile.project_type) finalProfile.project_type = finalProfile.purpose;
    finalProfile.purpose = "Start a Business";
  }
  if (!finalProfile.purpose || !["Start a Business", "Education", "Expand Business", "Financial Assistance"].includes(finalProfile.purpose)) {
    if (/\bbusiness\b|\bshop\b|\bsalon\b|\bstore\b|\bventure\b|\benterprise\b|\bloan\b/i.test(naturalText)) {
      finalProfile.purpose = "Start a Business";
    }
  }

  return finalProfile;
}

export async function generateExplanationHelper(userProfile: any, topRecommendation: any) {
  const apiKey = process.env.SARVAM_API_KEY;
  const isDevMode = process.env.DEV_MODE === "true";

  const top = topRecommendation;
  if (!top) {
    return "No matching schemes found for the specified criteria.";
  }

  const reasonsStr = top.reasons ? top.reasons.join("; ") : "Matches basic scheme criteria.";

  if (apiKey) {
    try {
      const systemPrompt =
        "Explain government scheme recommendations clearly in 2 simple sentences without inventing extra eligibility criteria.";
      const userMsg = `User Need: ${userProfile.purpose || "Financial support"}. Top Scheme Match: ${top.scheme_name}. Status: ${top.status}. Reasons: ${reasonsStr}.`;

      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sarvam-105b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } else {
        const errBody = await res.text();
        console.error(`Sarvam explanation API HTTP error ${res.status}: ${errBody}`);
        if (!isDevMode) {
          throw new Error(`Sarvam explanation API returned HTTP error ${res.status}: ${errBody}`);
        }
      }
    } catch (err: any) {
      console.error("Sarvam explanation API call exception:", err.message);
      if (!isDevMode) {
        throw new Error(`Sarvam explanation API call failed: ${err.message}`);
      }
    }
  }

  if (isDevMode) {
    return (
      `[DEV MOCK SARVAM] Based on your profile, '${top.scheme_name}' is recommended (${top.status}). ` +
      `Key matching reasons: ${reasonsStr}.`
    );
  }

  throw new Error(
    "SARVAM_API_KEY server-side environment variable is not configured on Convex. Please configure SARVAM_API_KEY in Convex server-side environment variables."
  );
}

export const parseIntent = action({
  args: {
    natural_text: v.string(),
    language: v.optional(v.string()),
    current_profile: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await parseIntentHelper(args.natural_text, args.language || "en", args.current_profile);
  },
});

export const generateExplanation = action({
  args: {
    user_profile: v.any(),
    top_recommendation: v.any(),
  },
  handler: async (ctx, args) => {
    return await generateExplanationHelper(args.user_profile, args.top_recommendation);
  },
});

export const translateText = action({
  args: {
    text: v.string(),
    source_lang: v.string(),
    target_lang: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.SARVAM_API_KEY;
    const isDevMode = process.env.DEV_MODE === "true";

    if (!args.text || args.source_lang.toLowerCase() === args.target_lang.toLowerCase()) {
      return args.text;
    }

    if (apiKey) {
      try {
        const systemPrompt = `Translate the text from ${args.source_lang} to ${args.target_lang} accurately. Respond only with the translated text.`;
        const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sarvam-105b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: args.text },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return content.trim();
        } else {
          const errBody = await res.text();
          console.error(`Sarvam translation API HTTP error ${res.status}: ${errBody}`);
          if (!isDevMode) {
            throw new Error(`Sarvam translation API returned HTTP error ${res.status}: ${errBody}`);
          }
        }
      } catch (err: any) {
        console.error("Sarvam translation API call exception:", err.message);
        if (!isDevMode) {
          throw new Error(`Sarvam translation API call failed: ${err.message}`);
        }
      }
    }

    if (isDevMode) {
      return `[DEV MOCK SARVAM TRANSLATION (${args.source_lang}->${args.target_lang})]: ${args.text}`;
    }

    throw new Error(
      "SARVAM_API_KEY server-side environment variable is not configured on Convex. Please configure SARVAM_API_KEY in Convex server-side environment variables."
    );
  },
});

