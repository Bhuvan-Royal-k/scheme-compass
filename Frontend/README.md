# Scheme Compass — Citizen Government Scheme Discovery Portal

Scheme Compass is an AI-powered government scheme discovery and financing portal designed to connect citizens with matching government welfare schemes and nearby channel partner physical branches.

## Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React 19, Vanilla CSS design system
- **Backend Infrastructure**: Convex Cloud (`https://healthy-seal-288.convex.cloud`)
- **AI NLU Engine**: Sarvam AI for natural-language intent understanding and translation
- **GIS & Directions**: Mappls REST API for discovering nearby physical branches and constructing directions

## Deployment Setup (Vercel)

1. Set the root directory to `Frontend` in Vercel.
2. Add Environment Variable:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://healthy-seal-288.convex.cloud
   ```
3. Build Command: `npm run build`

## Development

```bash
npm install
npm run dev
```
