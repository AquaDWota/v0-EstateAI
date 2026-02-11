#!/usr/bin/env python3
"""
Test script for Estate.AI Chat Protocol endpoint.
This script tests both the health check and chat endpoints.
"""

import json
import requests
import time
from typing import Dict, Any


# Configuration
BASE_URL = "http://127.0.0.1:8005"
STATUS_ENDPOINT = f"{BASE_URL}/status"
CHAT_ENDPOINT = f"{BASE_URL}/chat"


def test_healthcheck():
    """Test the /status endpoint"""
    print("=" * 60)
    print("TEST 1: Health Check Endpoint")
    print("=" * 60)
    
    try:
        response = requests.get(STATUS_ENDPOINT)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            return True
        else:
            print("❌ Health check failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_property_with_gemini():
    """Test property analysis with empty type (Gemini)"""
    print("\n" + "=" * 60)
    print("TEST 2: Property Analysis - Gemini (Empty Type)")
    print("=" * 60)
    
    property_data = {
        "address": "123 Main St, Los Angeles, CA",
        "listPrice": 500000,
        "estimatedRent": 3000,
        "type": "",  # Empty type triggers Gemini
        "zipCode": "90001",
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1800,
        "yearBuilt": 2005,
        "propertyTaxPerYear": 6000,
        "insurancePerYear": 1200,
        "hoaPerYear": 0
    }
    
    print(f"\nSending property data:")
    print(json.dumps(property_data, indent=2))
    
    # Note: This endpoint expects a proper Envelope format
    # For testing, we'll call the REST API endpoint instead
    print("\n⚠️  Chat endpoint requires proper Envelope format from uagents")
    print("For testing property analysis, use the REST API endpoint at /api/analyze")
    print("Example: POST http://127.0.0.1:8005/api/analyze")


def test_property_with_specialist():
    """Test property analysis with specific type (Specialist routing)"""
    print("\n" + "=" * 60)
    print("TEST 3: Property Analysis - Specialist Routing (Condo)")
    print("=" * 60)
    
    property_data = {
        "address": "456 Beach Blvd Unit 5A, Miami, FL",
        "listPrice": 400000,
        "estimatedRent": 2500,
        "type": "condo",  # Specific type triggers specialist routing
        "zipCode": "33139",
        "bedrooms": 2,
        "bathrooms": 2,
        "sqft": 1200,
        "yearBuilt": 2010,
        "propertyTaxPerYear": 4000,
        "insurancePerYear": 1500,
        "hoaPerYear": 6000
    }
    
    print(f"\nSending property data:")
    print(json.dumps(property_data, indent=2))
    
    print("\n⚠️  Chat endpoint requires proper Envelope format from uagents")
    print("For testing property analysis, use the REST API endpoint at /api/analyze")


def test_rest_api_endpoint():
    """Test the REST API endpoint which is more accessible for testing"""
    print("\n" + "=" * 60)
    print("TEST 4: REST API Endpoint - /api/analyze")
    print("=" * 60)
    
    request_data = {
        "properties": [
            {
                "address": "123 Main St, Los Angeles, CA",
                "listPrice": 500000,
                "estimatedRent": 3000,
                "type": "",  # Empty type triggers Gemini
                "zipCode": "90001",
                "bedrooms": 3,
                "bathrooms": 2,
                "sqft": 1800
            },
            {
                "address": "456 Beach Blvd Unit 5A, Miami, FL",
                "listPrice": 400000,
                "estimatedRent": 2500,
                "type": "condo",
                "zipCode": "33139",
                "bedrooms": 2,
                "bathrooms": 2,
                "sqft": 1200
            }
        ],
        "zipCode": "90001",
        "globalAssumptions": {
            "downPaymentPercent": 20,
            "interestRate": 7.0,
            "loanTermYears": 30
        }
    }
    
    print(f"\nSending request to /api/analyze...")
    print(f"Properties: {len(request_data['properties'])}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json=request_data,
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nResponse:")
            print(f"Status: {result.get('status')}")
            print(f"Message: {result.get('message')}")
            print(f"\nResults ({len(result.get('results', []))}):")
            
            for i, res in enumerate(result.get('results', []), 1):
                print(f"\n  Property {i}:")
                print(f"    Type: {res.get('type')}")
                print(f"    Analysis: {res.get('analysis', 'N/A')[:200]}...")
                if res.get('specialist'):
                    print(f"    Specialist: {res.get('specialist')}")
            
            print("\n✅ REST API test passed!")
            return True
        else:
            print(f"❌ REST API test failed!")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_agent_address():
    """Extract and display the agent address from health check"""
    print("\n" + "=" * 60)
    print("TEST 5: Agent Address for Agentverse")
    print("=" * 60)
    
    try:
        response = requests.get(STATUS_ENDPOINT)
        if response.status_code == 200:
            data = response.json()
            address = data.get('address')
            print(f"\nEstate.AI Agent Address:")
            print(f"  {address}")
            print(f"\nTo interact from Agentverse:")
            print(f"  1. Go to https://agentverse.ai")
            print(f"  2. Search for agent: {address}")
            print(f"  3. Use chat interface to send messages")
            print(f"  4. Send property JSON data for analysis")
            return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("ESTATE.AI CHAT PROTOCOL TEST SUITE")
    print("=" * 60)
    print("\nMake sure Estate_Ai_agent.py is running on port 8005!")
    print("Run: cd backend/agents && python Estate_Ai_agent.py\n")
    
    time.sleep(1)
    
    # Run tests
    results = []
    results.append(("Health Check", test_healthcheck()))
    results.append(("Agent Address", test_agent_address()))
    results.append(("REST API", test_rest_api_endpoint()))
    
    # Chat endpoint tests are informational only
    test_property_with_gemini()
    test_property_with_specialist()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print("\n" + "=" * 60)
    
    if all(result[1] for result in results):
        print("🎉 All tests passed!")
        print("\nNext steps:")
        print("  1. Get your agent address from the test output above")
        print("  2. Register on Agentverse: https://agentverse.ai")
        print("  3. Test chat protocol with other agents")
        print("  4. Deploy to production with AGENT_EXTERNAL_ENDPOINT")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    exit(main())
