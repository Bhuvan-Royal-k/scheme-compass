from typing import Optional, List
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    purpose: Optional[str] = Field(default=None, description="Primary purpose: business, education, expand, financial")
    project_type: Optional[str] = Field(default=None, description="Details of project or business")
    project_cost: Optional[float] = Field(default=None, description="Estimated project cost in INR")
    annual_income: Optional[float] = Field(default=None, description="Annual family income in INR")
    social_category: Optional[str] = Field(default=None, description="Social category: SC, ST, OBC, General")
    gender: Optional[str] = Field(default=None, description="Gender of applicant")
    age: Optional[int] = Field(default=None, description="Age of applicant")
    state_name: Optional[str] = Field(default=None, description="State of residence")
    loan_required: Optional[bool] = Field(default=True, description="Whether loan assistance is required")
    government_type: Optional[str] = Field(default=None, description="Target government type: Central or State")
    channel_partner_type: Optional[str] = Field(default=None, description="Preferred partner category: PSB, RRB, NBFC, MFI, etc.")
    natural_text: Optional[str] = Field(default=None, description="Raw input text in natural language")
    language: str = Field(default="en", description="ISO language code of input (e.g. en, ta, hi)")

class EligibilityResult(BaseModel):
    scheme_id: str
    scheme_name: str
    government_type: str
    channel_partner_type: str
    channel_partner_name: str
    maximum_benefit: str
    status: str = Field(description="eligible | ineligible | requires_verification")
    score: float = Field(description="Match score between 0.0 and 1.0")
    reasons: List[str] = Field(default_factory=list)
    documents_required: List[str] = Field(default_factory=list)
    state_name: Optional[str] = None

class RecommendationResponse(BaseModel):
    user_profile: UserProfile
    total_candidates: int
    recommendations: List[EligibilityResult]
    explanation: Optional[str] = None
    ai_provider: Optional[str] = None
