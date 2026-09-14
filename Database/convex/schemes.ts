import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllSchemes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schemes").collect();
  },
});

export const getSchemeById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as any);
  },
});

export const getSchemesByChannelPartner = query({
  args: {
    channel_partner_type: v.string(),
    channel_partner_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("schemes")
      .withIndex("by_channel_partner_type", (q) =>
        q.eq("channel_partner_type", args.channel_partner_type)
      );
    const results = await q.collect();
    if (args.channel_partner_name) {
      return results.filter(
        (s) => s.channel_partner_name === args.channel_partner_name
      );
    }
    return results;
  },
});

export const getSchemesByGovernmentType = query({
  args: { government_type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schemes")
      .withIndex("by_government_type", (q) =>
        q.eq("government_type", args.government_type)
      )
      .collect();
  },
});

export const insertBatch = mutation({
  args: {
    records: v.array(
      v.object({
        scheme_name: v.string(),
        government_type: v.string(),
        description: v.array(v.string()),
        documents_required: v.array(v.string()),
        channel_partner_type: v.string(),
        channel_partner_name: v.string(),
        npa_percentage: v.string(),
        fund_availability_status: v.string(),
        maximum_benefit: v.string(),
        state_name: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const record of args.records) {
      const id = await ctx.db.insert("schemes", record);
      insertedIds.push(id);
    }
    return insertedIds.length;
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("schemes").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return all.length;
  },
});
