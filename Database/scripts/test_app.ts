import { convexTest } from "convex-test";
import schema from "../convex/schema.js";
import * as schemes from "../convex/schemes.js";
import * as channelPartners from "../convex/channelPartners.js";
import * as api from "../convex/_generated/api.js";
import * as server from "../convex/_generated/server.js";
import { runMigration } from "./migrate.js";

const modules = {
  "./_generated/api.js": api,
  "./_generated/server.js": server,
  "./schemes.js": schemes,
  "./channelPartners.js": channelPartners,
};

async function testApplicationQueries() {
  console.log("==========================================");
  console.log("TESTING APPLICATION CONVEX QUERIES");
  console.log("==========================================");

  const t = convexTest(schema, modules as any);
  await runMigration(t);

  // 1. Test getAllSchemes
  console.log("\n1. Testing getAllSchemes...");
  const allSchemes = await t.query(schemes.getAllSchemes);
  console.log(`Fetched ${allSchemes.length} schemes.`);
  if (allSchemes.length !== 975) {
    throw new Error(`Expected 975 schemes, got ${allSchemes.length}`);
  }

  // 2. Test getSchemeById
  console.log("\n2. Testing getSchemeById...");
  const sampleScheme = allSchemes[0];
  const fetchedScheme = await t.query(schemes.getSchemeById, { id: sampleScheme._id });
  console.log(`Successfully fetched scheme by ID (${sampleScheme._id}): "${fetchedScheme.scheme_name}"`);
  if (!fetchedScheme || fetchedScheme.scheme_name !== sampleScheme.scheme_name) {
    throw new Error("getSchemeById mismatch");
  }

  // 3. Test getAllChannelPartners
  console.log("\n3. Testing getAllChannelPartners...");
  const allPartners = await t.query(channelPartners.getAllChannelPartners);
  console.log(`Fetched ${allPartners.length} channel partners.`);
  if (allPartners.length !== 485) {
    throw new Error(`Expected 485 channel partners, got ${allPartners.length}`);
  }

  // 4. Test getChannelPartnerById
  console.log("\n4. Testing getChannelPartnerById...");
  const samplePartner = allPartners[0];
  const fetchedPartner = await t.query(channelPartners.getChannelPartnerById, { id: samplePartner._id });
  console.log(`Successfully fetched partner by ID (${samplePartner._id}): "${fetchedPartner.name}" (${fetchedPartner.category})`);
  if (!fetchedPartner || fetchedPartner.name !== samplePartner.name) {
    throw new Error("getChannelPartnerById mismatch");
  }

  // 5. Test getChannelPartnersByCategory
  console.log("\n5. Testing getChannelPartnersByCategory ('PSB')...");
  const psbPartners = await t.query(channelPartners.getChannelPartnersByCategory, { category: "PSB" });
  console.log(`Fetched ${psbPartners.length} PSB partners (Expected: 125).`);
  if (psbPartners.length !== 125) {
    throw new Error(`Expected 125 PSB partners, got ${psbPartners.length}`);
  }

  // 6. Test getSchemesByChannelPartner
  console.log("\n6. Testing getSchemesByChannelPartner ('PSB', 'State Bank of India')...");
  const matchedSchemes = await t.query(schemes.getSchemesByChannelPartner, {
    channel_partner_type: "PSB",
    channel_partner_name: "State Bank of India",
  });
  console.log(`Found ${matchedSchemes.length} schemes matching State Bank of India.`);
  if (matchedSchemes.length > 0) {
    console.log(`Sample matching scheme: "${matchedSchemes[0].scheme_name}"`);
  }

  // 7. Test getSchemesByGovernmentType ('Central')
  console.log("\n7. Testing getSchemesByGovernmentType ('Central')...");
  const centralSchemes = await t.query(schemes.getSchemesByGovernmentType, { government_type: "Central" });
  console.log(`Found ${centralSchemes.length} Central government schemes.`);

  console.log("\n==========================================");
  console.log("ALL APPLICATION QUERIES & MATCHING TESTS PASSED!");
  console.log("==========================================");
}

testApplicationQueries().catch((err) => {
  console.error("Application test failed:", err);
  process.exit(1);
});
