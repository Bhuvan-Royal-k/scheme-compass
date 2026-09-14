import fs from "fs";
import path from "path";
import { convexTest } from "convex-test";
import schema from "../convex/schema.js";
import * as schemes from "../convex/schemes.js";
import * as channelPartners from "../convex/channelPartners.js";
import * as api from "../convex/_generated/api.js";
import * as server from "../convex/_generated/server.js";

const modules = {
  "./_generated/api.js": api,
  "./_generated/server.js": server,
  "./schemes.js": schemes,
  "./channelPartners.js": channelPartners,
};

export async function runMigration(tInstance?: any) {
  const t = tInstance || convexTest(schema, modules as any);

  const baseDir = path.resolve(process.cwd());
  const cpPath = path.join(baseDir, "channel_partners_600.json");
  const schemeDir = path.join(baseDir, "Scheme");

  console.log("==========================================");
  console.log("STARTING CONVEX MIGRATION PROCESS");
  console.log("==========================================");

  // 1. Clear existing Convex data for clean idempotent migration
  await t.mutation(schemes.clearAll);
  await t.mutation(channelPartners.clearAll);

  // 2. Read and migrate Channel Partner Database
  console.log(`Reading Channel Partner source file: ${cpPath}`);
  const cpRaw = fs.readFileSync(cpPath, "utf-8");
  const cpData = JSON.parse(cpRaw) as Record<string, string[]>;

  const cpRecordsToInsert: Array<{ category: string; name: string }> = [];
  const cpCategoryKeys = Object.keys(cpData);
  
  for (const category of cpCategoryKeys) {
    const names = cpData[category];
    if (!Array.isArray(names)) {
      throw new Error(`Category "${category}" in ${cpPath} is not an array.`);
    }
    for (const name of names) {
      if (typeof name !== "string") {
        throw new Error(`Channel partner name in "${category}" is not a string.`);
      }
      cpRecordsToInsert.push({ category, name });
    }
  }

  const sourceCpCount = cpRecordsToInsert.length;
  console.log(`Source Channel Partner records found: ${sourceCpCount}`);

  // Insert Channel Partners in batches of 100
  const BATCH_SIZE = 100;
  let cpMigratedCount = 0;
  for (let i = 0; i < cpRecordsToInsert.length; i += BATCH_SIZE) {
    const batch = cpRecordsToInsert.slice(i, i + BATCH_SIZE);
    const count = await t.mutation(channelPartners.insertBatch, { records: batch });
    cpMigratedCount += count;
  }
  console.log(`Successfully migrated ${cpMigratedCount} / ${sourceCpCount} Channel Partner records to Convex.`);

  // 3. Read and migrate Scheme Database
  console.log(`Reading Scheme source directory: ${schemeDir}`);
  const schemeFiles = fs.readdirSync(schemeDir).filter(f => f.endsWith(".json")).sort();
  console.log(`Found ${schemeFiles.length} scheme batch JSON files.`);

  const schemeRecordsToInsert: Array<{
    scheme_name: string;
    government_type: string;
    description: string[];
    documents_required: string[];
    channel_partner_type: string;
    channel_partner_name: string;
    npa_percentage: string;
    fund_availability_status: string;
    maximum_benefit: string;
    state_name?: string;
  }> = [];

  for (const file of schemeFiles) {
    const filePath = path.join(schemeDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const records = JSON.parse(content);
    if (!Array.isArray(records)) {
      throw new Error(`Scheme batch file ${file} does not contain an array.`);
    }
    for (const rec of records) {
      // Validate required fields
      const requiredFields = [
        "scheme_name",
        "government_type",
        "description",
        "documents_required",
        "channel_partner_type",
        "channel_partner_name",
        "npa_percentage",
        "fund_availability_status",
        "maximum_benefit"
      ];
      for (const field of requiredFields) {
        if (!(field in rec)) {
          throw new Error(`Record in ${file} missing required field "${field}".`);
        }
      }
      schemeRecordsToInsert.push({
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
      });
    }
  }

  const sourceSchemeCount = schemeRecordsToInsert.length;
  console.log(`Source Scheme records found across batch files: ${sourceSchemeCount}`);

  // Insert Schemes in batches of 50
  const SCHEME_BATCH_SIZE = 50;
  let schemeMigratedCount = 0;
  for (let i = 0; i < schemeRecordsToInsert.length; i += SCHEME_BATCH_SIZE) {
    const batch = schemeRecordsToInsert.slice(i, i + SCHEME_BATCH_SIZE);
    const count = await t.mutation(schemes.insertBatch, { records: batch });
    schemeMigratedCount += count;
  }
  console.log(`Successfully migrated ${schemeMigratedCount} / ${sourceSchemeCount} Scheme records to Convex.`);

  console.log("==========================================");
  console.log("MIGRATION SUMMARY:");
  console.log(`- Channel Partners: ${sourceCpCount} -> ${cpMigratedCount}`);
  console.log(`- Schemes:          ${sourceSchemeCount} -> ${schemeMigratedCount}`);
  console.log("==========================================");

  return {
    t,
    sourceCpCount,
    cpMigratedCount,
    sourceSchemeCount,
    schemeMigratedCount,
  };
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigration().catch((err) => {
    console.error("Migration failed with error:", err);
    process.exit(1);
  });
}
