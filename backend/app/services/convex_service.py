import httpx
from typing import Any, List, Dict, Optional
from app.core.config import settings

class ConvexService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.CONVEX_URL

    async def _query(self, query_path: str, args: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}/query/{query_path}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=args or {})
            if res.status_code != 200:
                raise RuntimeError(f"Convex service HTTP {res.status_code}: {res.text}")
            payload = res.json()
            if payload.get("status") == "error":
                raise RuntimeError(f"Convex function error: {payload.get('message')}")
            return payload.get("data")

    async def get_all_schemes(self) -> List[Dict[str, Any]]:
        return await self._query("schemes/getAllSchemes")

    async def get_scheme_by_id(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        return await self._query("schemes/getSchemeById", {"id": scheme_id})

    async def get_schemes_by_government_type(self, government_type: str) -> List[Dict[str, Any]]:
        return await self._query("schemes/getSchemesByGovernmentType", {"government_type": government_type})

    async def get_schemes_by_channel_partner(
        self, channel_partner_type: str, channel_partner_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return await self._query(
            "schemes/getSchemesByChannelPartner",
            {"channel_partner_type": channel_partner_type, "channel_partner_name": channel_partner_name},
        )

    async def get_all_channel_partners(self) -> List[Dict[str, Any]]:
        return await self._query("channelPartners/getAllChannelPartners")

    async def get_channel_partners_by_category(self, category: str) -> List[Dict[str, Any]]:
        return await self._query("channelPartners/getChannelPartnersByCategory", {"category": category})

convex_service = ConvexService()
