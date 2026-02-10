#!/usr/bin/env python3
"""
Test script to verify Estate AI agent integration with the backend.

This script tests:
1. Property with empty type (should use Gemini)
2. Property with specific type (should route to specialist)
"""

import json
import requests
import sys

# FastAPI backend URL
BASE_URL = "http://localhost:8000"

# Test property data
TEST_PROPERTY_EMPTY_TYPE = {
    "id": "test-001",
    "nickname": "Test Property - No Type",
    "address": "123 Test St, Boston, MA",
    "zipCode": "02118",
    "type": "",  # Empty type - should trigger Gemini analysis
    "listPrice": 500000,
    "estimatedRent": 3000,
    "propertyTaxPerYear": 6000,
    "insurancePerYear": 1200,
    "hoaPerYear": 0,
    "maintenancePerMonth": 200,
    "utilitiesPerMonth": 150,
    "vacancyRatePercent": 5,
    "downPaymentPercent": 20,
    "interestRatePercent": 6.5,
    "loanTermYears": 30,
    "closingCosts": 10000,
    "renovationBudget": 0,
    "arv": 500000
}

TEST_PROPERTY_WITH_TYPE = {
    **TEST_PROPERTY_EMPTY_TYPE,
    "id": "test-002",
    "nickname": "Test Property - Multi-Family",
    "type": "multi-family"  # Should route to multifamily agent
}

def test_analysis(property_data, test_name):
    """Test property analysis endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"{'='*60}")
    print(f"Property type: '{property_data['type']}'")
    
    payload = {
        "zipCode": property_data["zipCode"],
        "globalAssumptions": {
            "defaultVacancyRatePercent": 5,
            "defaultAppreciationRatePercent": 3,
            "defaultMaintenancePercent": 1
        },
        "properties": [property_data, property_data]  # Need at least 2 properties
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/agent-commentary",
            json=payload,
            timeout=90  # Long timeout for agent processing
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Success!")
            print(f"\nAgent Commentary:")
            commentary = result.get("agentCommentary", {})
            print(f"  Overall Summary: {commentary.get('overallSummary', 'N/A')[:100]}...")
            print(f"  Cash Flow: {commentary.get('cashFlowSummary', 'N/A')[:100]}...")
            print(f"  Key Bullets: {len(commentary.get('keyBullets', []))} items")
            
            if "detailedAnalysis" in commentary:
                print(f"\n  Detailed Analysis (first 200 chars):")
                print(f"  {commentary['detailedAnalysis'][:200]}...")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (agent may not be responding)")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_direct_agent():
    """Test sending message directly to Estate AI agent"""
    print(f"\n{'='*60}")
    print(f"Testing: Direct Agent Communication (Local)")
    print(f"{'='*60}")
    
    try:
        # Try to send directly to agent endpoint
        response = requests.post(
            "http://127.0.0.1:8005/submit",
            json=TEST_PROPERTY_EMPTY_TYPE,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Agent is reachable on port 8005")
            print(f"Response: {response.text[:200]}...")
        else:
            print(f"Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to agent on port 8005")
        print("   Make sure Estate_Ai_agent.py is running:")
        print("   cd backend/agents && python Estate_Ai_agent.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    print("Estate AI Agent Integration Test")
    print("="*60)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        print("✅ Backend is running")
    except:
        print("❌ Backend is not running on http://localhost:8000")
        print("   Start it with: cd backend && uvicorn main:app --reload")
        sys.exit(1)
    
    # Test direct agent connection
    test_direct_agent()
    
    # Test with empty type (Gemini)
    test_analysis(TEST_PROPERTY_EMPTY_TYPE, "Empty Type (Should use Gemini AI)")
    
    # Test with specific type (Specialist)
    test_analysis(TEST_PROPERTY_WITH_TYPE, "Multi-Family Type (Should route to specialist)")
    
    print(f"\n{'='*60}")
    print("Test Complete!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
