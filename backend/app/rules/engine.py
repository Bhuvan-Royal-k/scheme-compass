from typing import Dict, Any, List, Tuple
from app.models.profile import UserProfile, EligibilityResult

class RuleEngine:
    """
    Deterministic rule engine evaluating scheme eligibility based ONLY on supported database attributes.
    Statuses:
      - 'eligible': Passed all supported criteria cleanly.
      - 'ineligible': Failed at least one explicit criteria (e.g. wrong state, unavailable funds).
      - 'requires_verification': Candidate scheme matches target criteria, but requires document/income/category verification.
    """

    def evaluate_scheme(self, scheme: Dict[str, Any], profile: UserProfile) -> EligibilityResult:
        reasons: List[str] = []
        score: float = 0.5
        is_ineligible = False

        scheme_id = str(scheme.get("_id", ""))
        scheme_name = str(scheme.get("scheme_name", ""))
        gov_type = str(scheme.get("government_type", ""))
        cp_type = str(scheme.get("channel_partner_type", ""))
        cp_name = str(scheme.get("channel_partner_name", ""))
        max_benefit = str(scheme.get("maximum_benefit", ""))
        fund_status = str(scheme.get("fund_availability_status", ""))
        scheme_state = scheme.get("state_name")
        docs_required = scheme.get("documents_required", [])
        description = scheme.get("description", [])

        # Rule 1: Fund availability check
        if fund_status.lower() in ["unavailable", "closed", "exhausted"]:
            is_ineligible = True
            reasons.append("Funds for this scheme are currently marked unavailable.")

        # Rule 2: State applicability check
        if scheme_state and profile.state_name:
            if scheme_state.strip().lower() == profile.state_name.strip().lower():
                score += 0.2
                reasons.append(f"Applicable to resident state: {scheme_state}.")
            else:
                is_ineligible = True
                reasons.append(f"Scheme is restricted to state: '{scheme_state}' (Applicant state: '{profile.state_name}').")
        elif gov_type.strip().lower() == "central":
            score += 0.15
            reasons.append("Central Government scheme applicable pan-India.")

        # Rule 3: Government Type preference check
        if profile.government_type:
            if profile.government_type.strip().lower() == gov_type.strip().lower():
                score += 0.1
                reasons.append(f"Matches preferred government sector ({gov_type}).")

        # Rule 4: Preferred Channel Partner Type check
        if profile.channel_partner_type:
            if profile.channel_partner_type.strip().lower() == cp_type.strip().lower():
                score += 0.15
                reasons.append(f"Offered via preferred channel partner category: {cp_type}.")

        # Rule 5: Purpose / Text keyword match
        combined_desc = " ".join(description).lower() + " " + scheme_name.lower()
        if profile.purpose:
            p_lower = profile.purpose.lower()
            if p_lower in combined_desc or ("business" in p_lower and ("loan" in combined_desc or "finance" in combined_desc)):
                score += 0.1
                reasons.append(f"Aligns with stated objective ('{profile.purpose}').")

        # Status assignment
        if is_ineligible:
            final_status = "ineligible"
            final_score = max(0.0, score - 0.5)
        else:
            # If documents are required (caste, income, identity verification), mark as 'requires_verification' or 'eligible'
            if docs_required and len(docs_required) > 0:
                final_status = "requires_verification"
                reasons.append(f"Requires document verification ({len(docs_required)} document(s) needed).")
            else:
                final_status = "eligible"
                reasons.append("Meets all basic scheme criteria.")

            final_score = min(1.0, max(0.1, score))

        return EligibilityResult(
            scheme_id=scheme_id,
            scheme_name=scheme_name,
            government_type=gov_type,
            channel_partner_type=cp_type,
            channel_partner_name=cp_name,
            maximum_benefit=max_benefit,
            status=final_status,
            score=round(final_score, 2),
            reasons=reasons,
            documents_required=docs_required,
            state_name=scheme_state,
        )

rule_engine = RuleEngine()
