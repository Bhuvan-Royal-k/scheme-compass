import fs from "fs";
import path from "path";
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

export async function runVerification(tInstance?: any) {
  const t = tInstance || convexTest(schema, modules as any);

  const baseDir = path.resolve(process.cwd());
  const cpPath = path.join(baseDir, "channel_partners_600.json");
  const schemeDir = path.join(baseDir, "Scheme");

  console.log("==========================================");
  console.log("STARTING DATA INTEGRITY VERIFICATION");
  console.log("==========================================");

  let cpIntegrity = true;
  let schemeIntegrity = true;
  const failureReasons: string[] = [];

  // 1. Verify Channel Partners
  console.log("\n--- VERIFYING CHANNEL PARTNERS INTEGRITY ---");
  const cpRaw = fs.readFileSync(cpPath, "utf-8");
  const cpSourceData = JSON.parse(cpRaw) as Record<string, string[]>;
  
  const expectedCpRecords: Array<{ category: string; name: string }> = [];
  for (const cat of Object.keys(cpSourceData)) {
    for (const name of cpSourceData[cat]) {
      expectedCpRecords.push({ category: cat, name });
    }
  }

  const convexCpRecords = await t.query(channelPartners.getAllChannelPartners);
  console.log(`Source Channel Partner record count: ${expectedCpRecords.length}`);
  console.log(`Convex Channel Partner record count: ${convexCpRecords.length}`);

  if (expectedCpRecords.length !== convexCpRecords.length) {
    cpIntegrity = false;
    failureReasons.push(`CP Record count mismatch: Source=${expectedCpRecords.length}, Convex=${convexCpRecords.length}`);
  }

  // Deep comparison of Channel Partners
  const cpSourceMap = new Map<string, number>();
  expectedCpRecords.forEach(rec => {
    const key = `${rec.category}:::${rec.name}`;
    cpSourceMap.set(key, (cpSourceMap.get(key) || 0) + 1);
  });

  const cpConvexMap = new Map<string, number>();
  convexCpRecords.forEach(rec => {
    const key = `${rec.category}:::${rec.name}`;
    cpConvexMap.set(key, (cpConvexMap.get(key) || 0) + 1);
  });

  for (const [key, count] of cpSourceMap.entries()) {
    const convexCount = cpConvexMap.get(key) || 0;
    if (convexCount !== count) {
      cpIntegrity = false;
      failureReasons.push(`CP item mismatch for "${key}": Source=${count}, Convex=${convexCount}`);
    }
  }

  // Also test grouped query matching source structure
  const groupedCp = await t.query(channelPartners.getGroupedChannelPartners);
  for (const cat of Object.keys(cpSourceData)) {
    const sourceList = cpSourceData[cat];
    const convexList = groupedCp[cat] || [];
    if (sourceList.length !== convexList.length) {
      cpIntegrity = false;
      failureReasons.push(`CP category "${cat}" length mismatch: Source=${sourceList.length}, Convex=${convexList.length}`);
    }
  }

  if (cpIntegrity) {
    console.log("Channel Partner data integrity: PASS (100% match on count, structure, and values)");
  } else {
    console.log("Channel Partner data integrity: FAIL");
  }

  // 2. Verify Schemes
  console.log("\n--- VERIFYING SCHEME DATA INTEGRITY ---");
  const schemeFiles = fs.readdirSync(schemeDir).filter(f => f.endsWith(".json")).sort();
  const expectedSchemeRecords: any[] = [];

  for (const file of schemeFiles) {
    const filePath = path.join(schemeDir, file);
    const records = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expectedSchemeRecords.push(...records);
  }

  const convexSchemes = await t.query(schemes.getAllSchemes);
  console.log(`Source Scheme record count: ${expectedSchemeRecords.length}`);
  console.log(`Convex Scheme record count: ${convexSchemes.length}`);

  if (expectedSchemeRecords.length !== convexSchemes.length) {
    schemeIntegrity = false;
    failureReasons.push(`Scheme Record count mismatch: Source=${expectedSchemeRecords.length}, Convex=${convexSchemes.length}`);
  }

  // Deep property-by-property comparison for every single scheme record
  for (let i = 0; i < expectedSchemeRecords.length; i++) {
    const src = expectedSchemeRecords[i];
    const cvx = convexSchemes[i];

    if (!cvx) {
      schemeIntegrity = false;
      failureReasons.push(`Missing Convex scheme record at index ${i}`);
      break;
    }

    // Compare all fields
    const fieldsToCompare = [
      "scheme_name",
      "government_type",
      "channel_partner_type",
      "channel_partner_name",
      "npa_percentage",
      "fund_availability_status",
      "maximum_benefit"
    ];

    for (const field of fieldsToCompare) {
      if (src[field] !== cvx[field]) {
        schemeIntegrity = false;
        failureReasons.push(`Index ${i} field "${field}" mismatch: Source="${src[field]}", Convex="${cvx[field]}"`);
      }
    }

    // Optional field state_name
    if (src.state_name !== cvx.state_name) {
      schemeIntegrity = false;
      failureReasons.push(`Index ${i} field "state_name" mismatch: Source="${src.state_name}", Convex="${cvx.state_name}"`);
    }

    // Array fields comparison: description and documents_required
    if (JSON.stringify(src.description) !== JSON.stringify(cvx.description)) {
      schemeIntegrity = false;
      failureReasons.push(`Index ${i} "description" array mismatch.`);
    }

    if (JSON.stringify(src.documents_required) !== JSON.stringify(cvx.documents_required)) {
      schemeIntegrity = false;
      failureReasons.push(`Index ${i} "documents_required" array mismatch.`);
    }
  }

  if (schemeIntegrity) {
    console.log("Scheme data integrity: PASS (100% match on count, structure, optional fields, and arrays)");
  } else {
    console.log("Scheme data integrity: FAIL");
  }

  console.log("\n==========================================");
  console.log("FINAL INTEGRITY VERIFICATION RESULT:");
  console.log(`Scheme Data Integrity:         ${schemeIntegrity ? "PASS" : "FAIL"}`);
  console.log(`Channel Partner Data Integrity: ${cpIntegrity ? "PASS" : "FAIL"}`);
  console.log("==========================================");

  if (failureReasons.length > 0) {
    console.error("Failures detected:", failureReasons);
  }

  return {
    cpIntegrity,
    schemeIntegrity,
    pass: cpIntegrity && schemeIntegrity,
    failureReasons,
  };
}

if (process.argv[1] && process.argv[1].endsWith("verify.ts")) {
  (async () => {
    const migResult = await runMigration();
    const verResult = await runVerification(migResult.t);
    if (!verResult.pass) {
      process.exit(1);
    }
  })().catch((err) => {
    console.error("Verification script failed:", err);
    process.exit(1);
  });
}
