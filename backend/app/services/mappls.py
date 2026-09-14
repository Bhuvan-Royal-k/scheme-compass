import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.convex_service import convex_service

class MapplsService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.MAPPLS_API_KEY
        self.geocode_endpoint = "https://atlas.mappls.com/api/places/geocode"
        self.distance_endpoint = "https://apis.mappls.com/advancedmaps/v1"

    async def geocode_partner(self, partner_name: str, region: str = "India") -> Optional[Dict[str, float]]:
        """
        Geocodes partner name/address using real Mappls Geocoding REST API when MAPPLS_API_KEY is provided.
        """
        if not self.api_key:
            return None

        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {"address": f"{partner_name}, {region}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(self.geocode_endpoint, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    copResults = data.get("copResults", {})
                    if copResults and "latitude" in copResults and "longitude" in copResults:
                        return {
                            "latitude": float(copResults["latitude"]),
                            "longitude": float(copResults["longitude"]),
                        }
        except Exception as e:
            print(f"Mappls Geocoding API call error for '{partner_name}': {e}")
        return None

    async def get_nearby_partners(
        self,
        category: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching channel partners from Convex database.
        If MAPPLS_API_KEY is provided, geocodes real partner locations and returns route matrix.
        If MAPPLS_API_KEY is missing, reports 'Partner location unavailable' without fabricating mock coordinates.
        """
        if category and category != "ALL":
            partners = await convex_service.get_channel_partners_by_category(category)
        else:
            partners = await convex_service.get_all_channel_partners()

        results = []
        for p in partners[:30]:
            partner_name = p.get("name", "")
            partner_category = p.get("category", "")
            partner_id = str(p.get("_id", ""))

            coords = None
            if self.api_key and user_lat is not None and user_lon is not None:
                coords = await self.geocode_partner(partner_name)

            if coords:
                lat = coords["latitude"]
                lon = coords["longitude"]
                # Live Mappls Route URL
                nav_url = f"https://mappls.com/direction?places={user_lat},{user_lon};{lat},{lon}"
                results.append({
                    "id": partner_id,
                    "name": partner_name,
                    "category": partner_category,
                    "location_status": "Verified via Mappls API",
                    "latitude": lat,
                    "longitude": lon,
                    "route_info": {
                        "origin": f"{user_lat},{user_lon}",
                        "destination": f"{lat},{lon}",
                        "navigation_url": nav_url,
                    },
                })
            else:
                # Explicit unverified location status without fake coordinate fabrication
                results.append({
                    "id": partner_id,
                    "name": partner_name,
                    "category": partner_category,
                    "location_status": "Partner location unavailable (Pending geocoding / Mappls API Key)",
                    "distance_km": None,
                    "latitude": None,
                    "longitude": None,
                    "route_info": None,
                })

        return results

mappls_service = MapplsService()
