import httpx
import json
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.models.profile import UserProfile, EligibilityResult

class SarvamService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.endpoint = "https://api.sarvam.ai/v1/chat/completions"  # Sarvam standard endpoint interface

    async def parse_user_intent(self, text: str, existing_profile: Optional[UserProfile] = None) -> UserProfile:
        """
        Parses natural language text into a structured UserProfile.
        If SARVAM_API_KEY is present, queries Sarvam LLM API.
        If in DEV_MODE without API key, uses labeled DEV_MODE extraction.
        """
        base_dict = existing_profile.model_dump() if existing_profile else {}
        base_dict["natural_text"] = text

        if self.api_key:
            try:
                system_prompt = (
                    "You are an NLU assistant for government scheme intent extraction. "
                    "Extract user profile details from the text. Respond strictly in valid JSON with fields: "
                    "state_name, social_category (SC/ST/OBC/General), annual_income (number), project_cost (number), "
                    "purpose, loan_required (boolean), government_type (Central/State), channel_partner_type."
                )
                payload = {
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.1,
                }
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(self.endpoint, json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        extracted = json.loads(content)
                        for k, v in extracted.items():
                            if v is not None and k in UserProfile.model_fields:
                                base_dict[k] = v
                        return UserProfile(**base_dict)
            except Exception as e:
                print(f"Sarvam API call failed: {e}. Falling back to deterministic extraction.")

        # Dev Mode labeled fallback extraction if no key or API unavailable
        if settings.DEV_MODE:
            t_lower = text.lower()
            if "tamil nadu" in t_lower or "tn" in t_lower:
                base_dict["state_name"] = "Tamil Nadu"
            elif "kerala" in t_lower:
                base_dict["state_name"] = "Kerala"
            elif "maharashtra" in t_lower:
                base_dict["state_name"] = "Maharashtra"

            if "sc" in t_lower or "scheduled caste" in t_lower:
                base_dict["social_category"] = "Scheduled Caste (SC)"

            if "business" in t_lower:
                base_dict["purpose"] = "Start a Business"
            elif "education" in t_lower:
                base_dict["purpose"] = "Education"

            return UserProfile(**base_dict)

        raise RuntimeError("Sarvam API key missing and DEV_MODE is disabled.")

    async def generate_explanation(self, profile: UserProfile, recommendations: List[EligibilityResult]) -> str:
        """
        Generates human-friendly explanation of rule engine results.
        """
        if not recommendations:
            return "No matching schemes found for the specified criteria."

        top = recommendations[0]
        reasons_str = "; ".join(top.reasons) if top.reasons else "Matches basic scheme criteria."

        if self.api_key:
            try:
                system_prompt = "Explain scheme recommendations clearly in 2 simple sentences without inventing extra eligibility criteria."
                user_msg = f"User Stated Need: {profile.purpose or 'Financial support'}. Top Scheme Match: {top.scheme_name}. Status: {top.status}. Reasons: {reasons_str}."
                payload = {
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                }
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(self.endpoint, json=payload, headers=headers)
                    if res.status_code == 200:
                        return res.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"Sarvam explanation API call failed: {e}")

        # Standard explanation
        tag = "[DEV MOCK SARVAM] " if settings.DEV_MODE else ""
        return (
            f"{tag}Based on your profile, '{top.scheme_name}' is recommended ({top.status}). "
            f"Key matching reasons: {reasons_str}."
        )

sarvam_service = SarvamService()
