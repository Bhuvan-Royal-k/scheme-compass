import "dotenv/config";
import http from "http";
import { convexTest } from "convex-test";
import schema from "./convex/schema.js";
import * as schemes from "./convex/schemes.js";
import * as channelPartners from "./convex/channelPartners.js";
import * as sarvam from "./convex/sarvam.js";
import * as mappls from "./convex/mappls.js";
import * as recommendations from "./convex/recommendations.js";
import * as userProfiles from "./convex/userProfiles.js";
import * as applications from "./convex/applications.js";
import * as api from "./convex/_generated/api.js";
import * as serverModule from "./convex/_generated/server.js";
import { runMigration } from "./scripts/migrate.js";

const modules = {
  "./_generated/api.js": api,
  "./_generated/server.js": serverModule,
  "./schemes.js": schemes,
  "./channelPartners.js": channelPartners,
  "./sarvam.js": sarvam,
  "./mappls.js": mappls,
  "./recommendations.js": recommendations,
  "./userProfiles.js": userProfiles,
  "./applications.js": applications,
};

const PORT = process.env.CONVEX_PORT || 3210;

async function startServer() {
  console.log("Initializing Convex database engine...");
  const t = convexTest(schema, modules as any);
  await runMigration(t);
  console.log("Convex database engine ready with migrated records.");

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    try {
      if (pathname === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", service: "convex-local-server" }));
        return;
      }

      if ((pathname.startsWith("/query/") || pathname.startsWith("/action/")) && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (chunk) => {
          bodyStr += chunk;
        });
        req.on("end", async () => {
          try {
            const args = bodyStr ? JSON.parse(bodyStr) : {};
            const endpointPath = pathname.replace("/query/", "").replace("/action/", "");

            let result: any = null;

            switch (endpointPath) {
              case "schemes/getAllSchemes":
                result = await t.query(schemes.getAllSchemes, args);
                break;
              case "schemes/getSchemeById":
                result = await t.query(schemes.getSchemeById, { id: args.id });
                break;
              case "schemes/getSchemesByChannelPartner":
                result = await t.query(schemes.getSchemesByChannelPartner, args);
                break;
              case "schemes/getSchemesByGovernmentType":
                result = await t.query(schemes.getSchemesByGovernmentType, args);
                break;
              case "channelPartners/getAllChannelPartners":
                result = await t.query(channelPartners.getAllChannelPartners, args);
                break;
              case "channelPartners/getChannelPartnerById":
                result = await t.query(channelPartners.getChannelPartnerById, { id: args.id });
                break;
              case "channelPartners/getChannelPartnersByCategory":
                result = await t.query(channelPartners.getChannelPartnersByCategory, args);
                break;
              case "channelPartners/getGroupedChannelPartners":
                result = await t.query(channelPartners.getGroupedChannelPartners, args);
                break;
              case "recommendations/getRecommendations":
                result = await recommendations.getRecommendationsHelper((fn: any, a: any) => t.query(fn, a), args);
                break;
              case "sarvam/parseIntent":
                result = await t.action(sarvam.parseIntent, args);
                break;
              case "sarvam/generateExplanation":
                result = await t.action(sarvam.generateExplanation, args);
                break;
              case "sarvam/translateText":
                result = await t.action(sarvam.translateText, args);
                break;
              case "mappls/getNearbyPartners":
                result = await mappls.getNearbyPartnersHelper((fn: any, a: any) => t.query(fn, a), args);
                break;
              case "mappls/geocodeAddress":
                result = await t.action(mappls.geocodeAddress, args);
                break;
              case "userProfiles/saveProfile":
                result = await t.mutation(userProfiles.saveProfile, args);
                break;
              case "userProfiles/getProfile":
                result = await t.query(userProfiles.getProfile, args);
                break;
              case "applications/submitApplication":
                result = await t.mutation(applications.submitApplication, args);
                break;
              case "applications/getApplicationByTrackingCode":
                result = await t.query(applications.getApplicationByTrackingCode, args);
                break;
              default:
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Function not found: ${endpointPath}` }));
                return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "success", data: result }));
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: err.message }));
          }
        });
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Convex Local Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Convex local server:", err);
  process.exit(1);
});
