import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { evaluateScheme, UserProfileData } from "./rules";
import { parseIntentHelper, generateExplanationHelper } from "./sarvam";

export async function getRecommendationsHelper(queryRunner: any, args: any) {
  let profile: UserProfileData = { ...args };

  // Step 1: NLU Intent Parsing via helper if natural_text provided
  if (args.natural_text) {
    try {
      const parsed = await parseIntentHelper(
        args.natural_text,
        args.language || "en",
        profile
      );
      profile = { ...profile, ...parsed };
    } catch (err: any) {
      console.warn("Sarvam NLU parse intent fallback:", err.message);
    }
  }

  // Step 2: Query candidate schemes from Convex DB using provided runner (t.query or ctx.runQuery)
  let candidateSchemes: any[] = [];
  try {
    if (profile.government_type) {
      candidateSchemes = await queryRunner(api.schemes.getSchemesByGovernmentType, {
        government_type: profile.government_type,
      });
    } else {
      candidateSchemes = await queryRunner(api.schemes.getAllSchemes, {});
    }
  } catch (err: any) {
    console.error("Candidate schemes query error:", err.message);
    candidateSchemes = [];
  }

  // Step 3: Evaluate candidate schemes using Deterministic Rule Engine
  const results = candidateSchemes.map((s) => evaluateScheme(s, profile));

  // Step 4: Rank results by status and match score
  const statusPriority: Record<string, number> = {
    eligible: 0,
    requires_verification: 1,
    ineligible: 2,
  };

  results.sort((a, b) => {
    const prioA = statusPriority[a.status] ?? 3;
    const prioB = statusPriority[b.status] ?? 3;
    if (prioA !== prioB) return prioA - prioB;
    return b.score - a.score;
  });

  const topRecommendations = results.slice(0, 10);

  // Step 5: Generate AI explanation via helper
  let explanation = "";
  if (topRecommendations.length > 0) {
    try {
      explanation = await generateExplanationHelper(profile, topRecommendations[0]);
    } catch (err: any) {
      explanation = `Top match: '${topRecommendations[0].scheme_name}' (${topRecommendations[0].status}). ${topRecommendations[0].reasons.join(" ")}`;
    }
  }

  return {
    user_profile: profile,
    total_candidates: candidateSchemes.length,
    recommendations: topRecommendations,
    explanation,
    ai_provider: "Convex Backend + Sarvam NLU + Deterministic Rule Engine",
  };
}

export const getRecommendations = action({
  args: {
    purpose: v.optional(v.string()),
    project_type: v.optional(v.string()),
    project_cost: v.optional(v.number()),
    annual_income: v.optional(v.number()),
    social_category: v.optional(v.string()),
    gender: v.optional(v.string()),
    age: v.optional(v.number()),
    state_name: v.optional(v.string()),
    loan_required: v.optional(v.boolean()),
    government_type: v.optional(v.string()),
    channel_partner_type: v.optional(v.string()),
    natural_text: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const queryRunner = (fn: any, queryArgs: any) => ctx.runQuery(fn, queryArgs);
    return await getRecommendationsHelper(queryRunner, args);
  },
});
