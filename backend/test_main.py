import pytest
from unittest.mock import Mock, MagicMock, patch
from .main import call_agent_with_analysis_data


class TestCallAgentWithAnalysisData:
    """Test suite for call_agent_with_analysis_data function"""
    
    @pytest.fixture
    def sample_analysis_payload(self):
        """Sample analysis payload for testing"""
        return {
            "input": {
                "zipCode": "02118",
                "properties": [
                    {
                        "id": "prop-001",
                        "nickname": "Boston Triple Decker",
                        "address": "123 Main St, Boston, MA",
                        "listPrice": 750000,
                    }
                ]
            },
            "results": [
                {
                    "property": {
                        "id": "prop-001",
                        "nickname": "Boston Triple Decker",
                        "propertyType": "multi_family",
                        "listPrice": 750000,
                    },
                    "overallScore": 85.5,
                    "metrics": {
                        "cashOnCashReturnPercent": 12.5,
                        "riskLevel": "Medium"
                    }
                }
            ],
            "summary": "Analyzed 1 properties in ZIP 02118."
        }
    
    @pytest.mark.asyncio
    async def test_call_agent_with_multi_family(self, sample_analysis_payload):
        """Test calling agent with multi-family property"""
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert "cashFlowSummary" in response
        assert "riskSummary" in response
        assert "marketTimingSummary" in response
        assert "renovationSummary" in response
        assert "overallSummary" in response
        assert "keyBullets" in response
        assert isinstance(response["keyBullets"], list)
    
    @pytest.mark.asyncio
    async def test_call_agent_with_single_family(self, sample_analysis_payload):
        """Test calling agent with single-family property"""
        sample_analysis_payload["results"][0]["property"]["propertyType"] = "single_family"
        
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert response is not None
        assert "overallSummary" in response
    
    @pytest.mark.asyncio
    async def test_call_agent_with_condo(self, sample_analysis_payload):
        """Test calling agent with condo property"""
        sample_analysis_payload["results"][0]["property"]["propertyType"] = "condo"
        
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert response is not None
        assert "keyBullets" in response
    
    @pytest.mark.asyncio
    async def test_call_agent_with_townhouse(self, sample_analysis_payload):
        """Test calling agent with townhouse property"""
        sample_analysis_payload["results"][0]["property"]["propertyType"] = "townhouse"
        
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert response is not None
    
    @pytest.mark.asyncio
    async def test_call_agent_defaults_to_selector(self, sample_analysis_payload):
        """Test that unknown property type defaults to selector agent"""
        sample_analysis_payload["results"][0]["property"]["propertyType"] = "unknown_type"
        
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert response is not None
    
    @pytest.mark.asyncio
    async def test_empty_results_raises_error(self):
        """Test that empty results raises an error"""
        from fastapi import HTTPException
        
        empty_payload = {
            "input": {},
            "results": [],
            "summary": ""
        }
        
        with pytest.raises(HTTPException) as exc_info:
            await call_agent_with_analysis_data(empty_payload)
        
        assert exc_info.value.status_code == 400
    
    @pytest.mark.asyncio
    async def test_response_includes_summary(self, sample_analysis_payload):
        """Test that response includes the original summary"""
        response = await call_agent_with_analysis_data(sample_analysis_payload)
        
        assert sample_analysis_payload["summary"] in response["overallSummary"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])