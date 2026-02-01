import pytest
from unittest.mock import Mock, MagicMock
from .main import call_agent_with_user_data


class TestCallAgentWithUserData:
    """Test suite for call_agent_with_user_data function"""
    
    @pytest.fixture
    def mock_context(self):
        """Create a mock Context object"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value={
            "cashFlowSummary": "Positive monthly cash flow of $850",
            "riskSummary": "Medium risk investment",
            "marketTimingSummary": "Good time to buy",
            "renovationSummary": "Minor updates needed",
            "overallSummary": "Solid investment opportunity",
            "keyBullets": ["12% CoC return", "Below market price", "Strong rental demand"]
        })
        mock_ctx.logger = Mock()
        return mock_ctx
    
    @pytest.fixture
    def sample_property_data(self):
        """Sample property data for testing"""
        return {
            "id": "prop-001",
            "nickname": "Boston Triple Decker",
            "address": "123 Main St, Boston, MA",
            "zipCode": "02118",
            "listPrice": 750000,
            "estimatedRent": 4500,
            "propertyTaxPerYear": 8000,
            "insurancePerYear": 1500,
            "hoaPerYear": 0,
            "maintenancePerMonth": 300,
            "utilitiesPerMonth": 200,
            "vacancyRatePercent": 5,
            "downPaymentPercent": 20,
            "interestRatePercent": 6.5,
            "loanTermYears": 30,
            "closingCosts": 15000,
            "renovationBudget": 50000,
            "arv": 850000,
            "property_type": "multi_family"
        }
    
    def test_call_agent_with_single_family(self, mock_context, sample_property_data):
        """Test calling single family agent"""
        sample_property_data["property_type"] = "single_family"
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        assert "cashFlowSummary" in response
        assert "riskSummary" in response
    
    def test_call_agent_with_multi_family(self, mock_context, sample_property_data):
        """Test calling multi family agent"""
        sample_property_data["property_type"] = "multi_family"
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        call_args = mock_context.send.call_args[0]
        payload = call_args[1]
        
        # Verify the payload structure
        assert "property" in payload.message
        assert payload.message["property"]["listPrice"] == 750000
    
    def test_call_agent_with_condo(self, mock_context, sample_property_data):
        """Test calling condo agent"""
        sample_property_data["property_type"] = "condo"
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        assert response is not None
    
    def test_call_agent_with_townhouse(self, mock_context, sample_property_data):
        """Test calling townhouse agent"""
        sample_property_data["property_type"] = "townhouse"
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        assert response is not None
    
    def test_call_agent_defaults_to_selector(self, mock_context, sample_property_data):
        """Test that unknown property type defaults to selector agent"""
        sample_property_data["property_type"] = "unknown_type"
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        assert response is not None
    
    def test_property_data_mapping(self, mock_context, sample_property_data):
        """Test that property data is correctly mapped to analysis request"""
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        # Get the payload that was sent
        call_args = mock_context.send.call_args[0]
        payload = call_args[1]
        property_data = payload.message["property"]
        
        # Verify all fields are mapped
        assert property_data["id"] == "prop-001"
        assert property_data["nickname"] == "Boston Triple Decker"
        assert property_data["listPrice"] == 750000
        assert property_data["estimatedRent"] == 4500
        assert property_data["zipCode"] == "02118"
    
    def test_missing_property_type_defaults(self, mock_context, sample_property_data):
        """Test that missing property_type defaults to single_family"""
        del sample_property_data["property_type"]
        
        response = call_agent_with_user_data(mock_context, sample_property_data)
        
        assert mock_context.send.called
        assert response is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])