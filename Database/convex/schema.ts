import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  schemes: defineTable({
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
    .index("by_channel_partner_type", ["channel_partner_type"])
    .index("by_government_type", ["government_type"])
    .index("by_state_name", ["state_name"]),

  channelPartners: defineTable({
    category: v.string(),
    name: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_name", ["name"]),

  userProfiles: defineTable({
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
    created_at: v.number(),
  }),

  applications: defineTable({
    scheme_id: v.string(),
    scheme_name: v.string(),
    applicant_name: v.optional(v.string()),
    contact_number: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.string(),
    channel_partner_name: v.optional(v.string()),
    tracking_code: v.string(),
    created_at: v.number(),
  })
    .index("by_tracking_code", ["tracking_code"])
    .index("by_status", ["status"]),
});
