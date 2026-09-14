from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.profile import UserProfile, RecommendationResponse, EligibilityResult
from app.services.convex_service import convex_service
from app.rules.engine import rule_engine
from app.ai.sarvam import sarvam_service
from app.services.mappls import mappls_service

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "scheme-compass-backend"}

@router.post("/api/parse-intent", response_model=UserProfile)
async def parse_intent(profile_in: UserProfile):
    if profile_in.natural_text:
        extracted_profile = await sarvam_service.parse_user_intent(profile_in.natural_text, profile_in)
        return extracted_profile
    return profile_in

@router.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(profile_in: UserProfile):
    try:
        profile = profile_in
        if profile_in.natural_text:
            profile = await parse_intent(profile_in)

        if profile.government_type:
            candidate_schemes = await convex_service.get_schemes_by_government_type(profile.government_type)
        else:
            candidate_schemes = await convex_service.get_all_schemes()

        results: List[EligibilityResult] = []
        for scheme in candidate_schemes:
            eval_res = rule_engine.evaluate_scheme(scheme, profile)
            results.append(eval_res)

        status_priority = {"eligible": 0, "requires_verification": 1, "ineligible": 2}
        results.sort(key=lambda r: (status_priority.get(r.status, 3), -r.score))

        top_recommendations = results[:10]
        explanation = await sarvam_service.generate_explanation(profile, top_recommendations)

        return RecommendationResponse(
            user_profile=profile,
            total_candidates=len(candidate_schemes),
            recommendations=top_recommendations,
            explanation=explanation,
            ai_provider="Convex Backend + Sarvam NLU + Deterministic Rule Engine",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/partners/nearby")
async def get_nearby_partners(
    category: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
):
    try:
        partners = await mappls_service.get_nearby_partners(category=category, user_lat=lat, user_lon=lon)
        return {"category": category, "total": len(partners), "partners": partners}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
