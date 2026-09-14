import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitApplication = mutation({
  args: {
    scheme_id: v.string(),
    scheme_name: v.string(),
    applicant_name: v.optional(v.string()),
    contact_number: v.optional(v.string()),
    email: v.optional(v.string()),
    channel_partner_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate unique tracking code (e.g. SC-2026-XXXX)
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `SC-2026-${randomHex}`;

    const applicationId = await ctx.db.insert("applications", {
      ...args,
      status: "Submitted - Pending Channel Partner Verification",
      tracking_code: trackingCode,
      created_at: Date.now(),
    });

    return {
      application_id: applicationId,
      tracking_code: trackingCode,
      status: "Submitted - Pending Channel Partner Verification",
    };
  },
});

export const getApplicationByTrackingCode = query({
  args: { tracking_code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("applications")
      .withIndex("by_tracking_code", (q) => q.eq("tracking_code", args.tracking_code))
      .first();
  },
});
