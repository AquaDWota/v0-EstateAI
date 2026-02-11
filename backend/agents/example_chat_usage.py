#!/usr/bin/env python3
"""
Example: How to communicate with Estate.AI agent using Chat Protocol

This script demonstrates three methods to interact with Estate.AI:
1. Using uagents framework (agent-to-agent)
2. Using direct HTTP POST with proper envelope
3. Using the REST API endpoint (easiest for testing)
"""

import os
import json
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import ChatMessage, TextContent
from dotenv import load_dotenv

load_dotenv()

# Estate.AI agent configuration
ESTATE_AI_ADDRESS = "agent1q04xd4gvvp..."  # Replace with actual address from /status endpoint
ESTATE_AI_REST_URL = "http://127.0.0.1:8005/api/analyze"


# ========================================
# METHOD 1: Agent-to-Agent Communication
# ========================================
def example_agent_to_agent():
    """
    Create an agent that communicates with Estate.AI using the chat protocol.
    This is the recommended method for agent-to-agent communication.
    """
    
    # Create your agent
    my_agent = Agent(
        name="PropertyInvestor",
        seed="property-investor-seed-12345",  # Use a unique seed
        port=8006,  # Different port from Estate.AI
        network="testnet"
    )
    
    @my_agent.on_event("startup")
    async def send_property_analysis_request(ctx: Context):
        """Send a property analysis request on startup"""
        
        # Property data to analyze
        property_data = {
            "address": "123 Main St, Los Angeles, CA",
            "listPrice": 500000,
            "estimatedRent": 3000,
            "type": "single-family",  # Or leave empty "" for Gemini analysis
            "zipCode": "90001",
            "bedrooms": 3,
            "bathrooms": 2,
            "sqft": 1800,
            "yearBuilt": 2005,
            "propertyTaxPerYear": 6000,
            "insurancePerYear": 1200,
            "hoaPerYear": 0
        }
        
        # Convert to JSON string
        message_text = json.dumps(property_data)
        
        # Send chat message to Estate.AI
        ctx.logger.info(f"Sending property analysis request to Estate.AI...")
        await ctx.send(
            ESTATE_AI_ADDRESS,
            ChatMessage([TextContent(message_text)])
        )
        ctx.logger.info("Request sent! Waiting for response...")
    
    @my_agent.on_message(ChatMessage)
    async def handle_estate_ai_response(ctx: Context, sender: str, msg: ChatMessage):
        """Handle response from Estate.AI"""
        if sender == ESTATE_AI_ADDRESS:
            response_text = msg.text()
            ctx.logger.info(f"📨 Received analysis from Estate.AI:")
            ctx.logger.info(f"{response_text}")
            
            # Process the analysis...
            # You can parse the response and make investment decisions
    
    # Run the agent
    my_agent.run()


# ========================================
# METHOD 2: Direct HTTP POST (Advanced)
# ========================================
def example_direct_http():
    """
    Send a message using direct HTTP POST with proper envelope format.
    This requires understanding of the uagents envelope structure.
    """
    import requests
    from uagents_core.identity import Identity
    from uagents_core.envelope import Envelope
    
    # Create your identity
    my_identity = Identity.from_seed("my-unique-seed-phrase", 0)
    
    # Property data
    property_data = {
        "address": "456 Beach Blvd, Miami, FL",
        "listPrice": 400000,
        "estimatedRent": 2500,
        "type": "condo",
        "zipCode": "33139"
    }
    
    # Create chat message
    chat_msg = ChatMessage([TextContent(json.dumps(property_data))])
    
    # Create envelope (simplified - actual implementation is more complex)
    envelope = {
        "version": 1,
        "sender": my_identity.address,
        "target": ESTATE_AI_ADDRESS,
        "payload": chat_msg.model_dump_json(),
        # ... additional envelope fields
    }
    
    # Send to Estate.AI chat endpoint
    response = requests.post(
        "http://127.0.0.1:8005/chat",
        json=envelope
    )
    
    print(f"Response: {response.status_code}")
    print(f"Note: This is a simplified example. Actual envelope creation is more complex.")


# ========================================
# METHOD 3: REST API Endpoint (Easiest)
# ========================================
def example_rest_api():
    """
    Use the REST API endpoint - easiest method for testing and integration.
    This doesn't require understanding the chat protocol envelope format.
    """
    import requests
    
    # Prepare request
    request_data = {
        "properties": [
            {
                "address": "123 Main St, Los Angeles, CA",
                "listPrice": 500000,
                "estimatedRent": 3000,
                "type": "",  # Empty for Gemini analysis
                "zipCode": "90001",
                "bedrooms": 3,
                "bathrooms": 2,
                "sqft": 1800,
                "yearBuilt": 2005,
                "propertyTaxPerYear": 6000,
                "insurancePerYear": 1200,
                "hoaPerYear": 0
            },
            {
                "address": "456 Beach Blvd Unit 5A, Miami, FL",
                "listPrice": 400000,
                "estimatedRent": 2500,
                "type": "condo",
                "zipCode": "33139",
                "bedrooms": 2,
                "bathrooms": 2,
                "sqft": 1200,
                "yearBuilt": 2010,
                "propertyTaxPerYear": 4000,
                "insurancePerYear": 1500,
                "hoaPerYear": 6000
            }
        ],
        "zipCode": "90001",
        "globalAssumptions": {
            "downPaymentPercent": 20,
            "interestRate": 7.0,
            "loanTermYears": 30
        }
    }
    
    print("Sending analysis request to Estate.AI REST API...")
    
    # Send request
    response = requests.post(
        ESTATE_AI_REST_URL,
        json=request_data,
        timeout=30
    )
    
    # Process response
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Success! Status: {result['status']}")
        print(f"Message: {result['message']}")
        print(f"\nAnalysis Results:")
        
        for i, res in enumerate(result['results'], 1):
            print(f"\nProperty {i}:")
            print(f"  Type: {res['type']}")
            if res['type'] == 'gemini':
                print(f"  Analysis (Gemini AI):")
                print(f"    {res['analysis'][:300]}...")
            elif res['type'] == 'specialist':
                print(f"  Specialist: {res['specialist']}")
                print(f"  Analysis: {res['analysis']}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")


# ========================================
# METHOD 4: Agentverse Integration
# ========================================
def example_agentverse_integration():
    """
    Example of how to make your agent discoverable on Agentverse
    so Estate.AI can be accessed from anywhere.
    """
    
    my_agent = Agent(
        name="YourAgent",
        seed="your-unique-seed",
        port=8006,
        mailbox=True,  # Enable mailbox for async messaging
        network="testnet"  # or "mainnet" for production
    )
    
    # Your agent will automatically be registered on Agentverse when:
    # 1. mailbox=True is set
    # 2. Agent is running
    # 3. AGENTVERSE_API_KEY is set (optional but recommended)
    
    @my_agent.on_event("startup")
    async def on_startup(ctx: Context):
        ctx.logger.info(f"Agent address: {ctx.agent.address}")
        ctx.logger.info("Agent is now discoverable on Agentverse!")
        ctx.logger.info("You can interact with Estate.AI through the Agentverse chat interface")
    
    my_agent.run()


# ========================================
# Main - Choose your method
# ========================================
if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("ESTATE.AI COMMUNICATION EXAMPLES")
    print("=" * 60)
    print("\nChoose a method:")
    print("1. Agent-to-Agent (uagents framework)")
    print("2. Direct HTTP POST (advanced)")
    print("3. REST API endpoint (easiest)")
    print("4. Agentverse integration info")
    print()
    
    choice = input("Enter your choice (1-4): ").strip()
    
    if choice == "1":
        print("\n⚠️  Make sure to update ESTATE_AI_ADDRESS in this script first!")
        print("Get the address by running: curl http://127.0.0.1:8005/status")
        confirm = input("\nContinue? (y/n): ")
        if confirm.lower() == 'y':
            example_agent_to_agent()
    
    elif choice == "2":
        print("\n⚠️  This is an advanced example showing the envelope structure.")
        print("For actual implementation, use Method 1 or 3.")
        example_direct_http()
    
    elif choice == "3":
        print("\n✅ Using REST API - this is the easiest method!")
        example_rest_api()
    
    elif choice == "4":
        print("\nAgentverse Integration:")
        print("-" * 60)
        print("To make your agent discoverable on Agentverse:")
        print("  1. Set mailbox=True in your Agent config")
        print("  2. Run your agent")
        print("  3. Your agent will appear in Agentverse dashboard")
        print("  4. Other agents can find you by your address")
        print("\nTo interact with Estate.AI:")
        print("  1. Get Estate.AI address: curl http://127.0.0.1:8005/status")
        print("  2. Visit https://agentverse.ai")
        print("  3. Search for Estate.AI agent")
        print("  4. Use chat interface to send property data")
        print("\nFor production deployment:")
        print("  - Set AGENT_EXTERNAL_ENDPOINT in environment")
        print("  - Use HTTPS for security")
        print("  - Consider network='mainnet'")
    
    else:
        print("Invalid choice!")
        sys.exit(1)
