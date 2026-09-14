import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveProfile = mutation({
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
    const profileId = await ctx.db.insert("userProfiles", {
      ...args,
      created_at: Date.now(),
    });
    return profileId;
  },
});

export const getProfile = query({
  args: { id: v.id("userProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
