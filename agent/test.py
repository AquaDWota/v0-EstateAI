import sys
from pathlib import Path

# Add parent directory to path so we can import agent module
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from unittest.mock import Mock, MagicMock
from agent.agent import AgentverseClient, AgentMessage


class TestAgentverseClient:
    """Test suite for AgentverseClient"""
    
    def test_init_without_context(self):
        """Test initialization without context"""
        client = AgentverseClient()
        assert client.ctx is None
    
    def test_init_with_context(self):
        """Test initialization with context"""
        mock_ctx = Mock()
        client = AgentverseClient(ctx=mock_ctx)
        assert client.ctx == mock_ctx
    
    def test_build_message(self):
        """Test message building"""
        client = AgentverseClient()
        body = {"key": "value"}
        msg = client._build_message("test_subject", body)
        
        assert isinstance(msg, AgentMessage)
        assert msg.subject == "test_subject"
        assert msg.message == body
    
    def test_call_agent_without_context_raises_error(self):
        """Test that calling agent without context raises error"""
        client = AgentverseClient()
        
        with pytest.raises(RuntimeError, match="Context is required"):
            client.call_agent("selector", "test", {"data": "test"})
    
    def test_call_agent_with_invalid_key_raises_error(self):
        """Test that invalid agent key raises error"""
        mock_ctx = Mock()
        client = AgentverseClient(ctx=mock_ctx)
        
        with pytest.raises(KeyError, match="Unknown agent_key"):
            client.call_agent("invalid_agent", "test", {"data": "test"})
    
    def test_call_agent_sends_message(self):
        """Test that call_agent sends message correctly"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"property_type": "single_family"}
        
        result = client.call_agent("selector", "selector", body)
        
        # Verify send was called
        assert mock_ctx.send.called
        call_args = mock_ctx.send.call_args
        
        # Check agent address
        assert call_args[0][0] == "agent1qgkq02guhyjsvdlum38rc6jm6y6wdsc6zy8jw267cjadf2a09ydag36t75n"
        
        # Check message payload
        payload = call_args[0][1]
        assert isinstance(payload, AgentMessage)
        assert payload.subject == "selector"
        assert payload.message == body
    
    def test_callSelectorAgent(self):
        """Test selector agent wrapper"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"data": "test"}
        
        client.callSelectorAgent(body)
        
        assert mock_ctx.send.called
        payload = mock_ctx.send.call_args[0][1]
        assert payload.subject == "selector"
    
    def test_callSingleFamily(self):
        """Test single family agent wrapper"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"data": "test"}
        
        client.callSingleFamily(body)
        
        assert mock_ctx.send.called
        payload = mock_ctx.send.call_args[0][1]
        assert payload.subject == "single_family"
    
    def test_callMultiFamily(self):
        """Test multi family agent wrapper"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"data": "test"}
        
        client.callMultiFamily(body)
        
        assert mock_ctx.send.called
        payload = mock_ctx.send.call_args[0][1]
        assert payload.subject == "multi_family"
    
    def test_callCondoFamily(self):
        """Test condo agent wrapper"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"data": "test"}
        
        client.callCondoFamily(body)
        
        assert mock_ctx.send.called
        payload = mock_ctx.send.call_args[0][1]
        assert payload.subject == "condo"
    
    def test_callTownHouse(self):
        """Test townhouse agent wrapper"""
        mock_ctx = Mock()
        mock_ctx.send = MagicMock(return_value=None)
        
        client = AgentverseClient(ctx=mock_ctx)
        body = {"data": "test"}
        
        client.callTownHouse(body)
        
        assert mock_ctx.send.called
        payload = mock_ctx.send.call_args[0][1]
        assert payload.subject == "townhouse"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
