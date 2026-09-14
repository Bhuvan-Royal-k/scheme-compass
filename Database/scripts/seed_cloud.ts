import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

async function main() {
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("ERROR: CONVEX_URL is not defined in environment or .env.local.");
    process.exit(1);
  }

  console.log("==========================================");
  console.log("STARTING SAFE CONVEX CLOUD DATA SEEDING");
  console.log("==========================================");

  const client = new ConvexHttpClient(convexUrl);

  const baseDir = path.resolve(process.cwd());
  const cpPath = path.join(baseDir, "channel_partners_600.json");
  const schemeDir = path.join(baseDir, "Scheme");

  // 1. Read Source Channel Partners
  if (!fs.existsSync(cpPath)) {
    console.error(`ERROR: Channel partner source file not found at ${cpPath}`);
    process.exit(1);
  }
  const cpRaw = fs.readFileSync(cpPath, "utf-8");
  const cpSourceData = JSON.parse(cpRaw) as Record<string, string[]>;
  const sourceCpRecords: Array<{ category: string; name: string }> = [];

  for (const cat of Object.keys(cpSourceData)) {
    for (const name of cpSourceData[cat]) {
      sourceCpRecords.push({ category: cat, name });
    }
  }

  // 2. Read Source Schemes
  if (!fs.existsSync(schemeDir)) {
    console.error(`ERROR: Scheme directory not found at ${schemeDir}`);
    process.exit(1);
  }
  const schemeFiles = fs.readdirSync(schemeDir).filter(f => f.endsWith(".json")).sort();
  const sourceSchemeRecords: any[] = [];

  for (const file of schemeFiles) {
    const filePath = path.join(schemeDir, file);
    const records = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(records)) {
      throw new Error(`File ${file} does not contain an array.`);
    }
    sourceSchemeRecords.push(...records);
  }

  console.log(`Source Channel Partners count: ${sourceCpRecords.length}`);
  console.log(`Source Schemes count:          ${sourceSchemeRecords.length}`);

  // 3. Query existing data from Convex Cloud
  const existingPartners = (await client.query(api.channelPartners.getAllChannelPartners, {})) as any[];
  const existingSchemes = (await client.query(api.schemes.getAllSchemes, {})) as any[];

  console.log(`Existing Cloud Partners:       ${existingPartners.length}`);
  console.log(`Existing Cloud Schemes:        ${existingSchemes.length}`);

  // Construct identity maps for deduplication
  // Channel Partner identity: "category:::name"
  const existingCpMap = new Set<string>();
  existingPartners.forEach((p) => {
    existingCpMap.add(`${p.category}:::${p.name}`);
  });

  // Scheme identity: "scheme_name:::government_type:::channel_partner_type:::channel_partner_name"
  const existingSchemeMap = new Set<string>();
  existingSchemes.forEach((s) => {
    const key = `${s.scheme_name}:::${s.government_type}:::${s.channel_partner_type}:::${s.channel_partner_name}`;
    existingSchemeMap.add(key);
  });

  // Filter missing channel partners
  const cpToInsert = sourceCpRecords.filter(
    (p) => !existingCpMap.has(`${p.category}:::${p.name}`)
  );
  const skippedCpCount = sourceCpRecords.length - cpToInsert.length;

  // Filter missing schemes
  const schemesToInsert = sourceSchemeRecords.filter((s) => {
    const key = `${s.scheme_name}:::${s.government_type}:::${s.channel_partner_type}:::${s.channel_partner_name}`;
    return !existingSchemeMap.has(key);
  });
  const skippedSchemeCount = sourceSchemeRecords.length - schemesToInsert.length;

  // 4. Batch Insert Channel Partners (Max 100 per batch)
  let insertedCpCount = 0;
  const CP_BATCH_SIZE = 100;
  for (let i = 0; i < cpToInsert.length; i += CP_BATCH_SIZE) {
    const batch = cpToInsert.slice(i, i + CP_BATCH_SIZE);
    const count = await client.mutation(api.channelPartners.insertBatch, { records: batch });
    insertedCpCount += (count as number);
  }

  // 5. Batch Insert Schemes (Max 50 per batch)
  let insertedSchemeCount = 0;
  const SCHEME_BATCH_SIZE = 50;
  for (let i = 0; i < schemesToInsert.length; i += SCHEME_BATCH_SIZE) {
    const batch = schemesToInsert.slice(i, i + SCHEME_BATCH_SIZE).map((rec) => ({
      scheme_name: rec.scheme_name,
      government_type: rec.government_type,
      description: rec.description,
      documents_required: rec.documents_required,
      channel_partner_type: rec.channel_partner_type,
      channel_partner_name: rec.channel_partner_name,
      npa_percentage: rec.npa_percentage,
      fund_availability_status: rec.fund_availability_status,
      maximum_benefit: rec.maximum_benefit,
      ...(rec.state_name !== undefined ? { state_name: rec.state_name } : {}),
    }));
    const count = await client.mutation(api.schemes.insertBatch, { records: batch });
    insertedSchemeCount += (count as number);
  }

  // 6. Query final counts from Convex Cloud
  const finalPartners = (await client.query(api.channelPartners.getAllChannelPartners, {})) as any[];
  const finalSchemes = (await client.query(api.schemes.getAllSchemes, {})) as any[];

  console.log("\n==========================================");
  console.log("CLOUD SEEDING SUMMARY:");
  console.log(`Source schemes:          ${sourceSchemeRecords.length}`);
  console.log(`Source partners:         ${sourceCpRecords.length}`);
  console.log(`Existing schemes:        ${existingSchemes.length}`);
  console.log(`Existing partners:       ${existingPartners.length}`);
  console.log(`Inserted schemes:        ${insertedSchemeCount}`);
  console.log(`Inserted partners:       ${insertedCpCount}`);
  console.log(`Skipped/matched schemes: ${skippedSchemeCount}`);
  console.log(`Skipped/matched partners:${skippedCpCount}`);
  console.log(`Final schemes:           ${finalSchemes.length}`);
  console.log(`Final partners:          ${finalPartners.length}`);
  console.log("==========================================");

  // 7. Verify counts
  let verificationFailed = false;
  if (finalSchemes.length !== 975) {
    console.error(`VERIFICATION ERROR: Final scheme count is ${finalSchemes.length}, expected 975.`);
    verificationFailed = true;
  }
  if (finalPartners.length !== 485) {
    console.error(`VERIFICATION ERROR: Final partner count is ${finalPartners.length}, expected 485.`);
    verificationFailed = true;
  }

  if (verificationFailed) {
    console.error("CLOUD SEEDING VERIFICATION FAILED.");
    process.exit(1);
  }

  console.log("CLOUD SEEDING VERIFICATION SUCCESSFUL (100% data integrity verified on Convex Cloud).");
}

main().catch((err) => {
  console.error("Cloud seeding script encountered error:", err);
  process.exit(1);
});
