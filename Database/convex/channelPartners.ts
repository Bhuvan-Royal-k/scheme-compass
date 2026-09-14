import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllChannelPartners = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("channelPartners").collect();
  },
});

export const getChannelPartnerById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as any);
  },
});

export const getChannelPartnersByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channelPartners")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const getGroupedChannelPartners = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("channelPartners").collect();
    const grouped: Record<string, string[]> = {};
    for (const doc of all) {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc.name);
    }
    return grouped;
  },
});

export const insertBatch = mutation({
  args: {
    records: v.array(
      v.object({
        category: v.string(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const record of args.records) {
      const id = await ctx.db.insert("channelPartners", record);
      insertedIds.push(id);
    }
    return insertedIds.length;
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("channelPartners").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return all.length;
  },
});
