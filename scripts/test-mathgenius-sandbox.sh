#!/bin/bash
#
# Test MathGenius Learning Sandbox Credentials
# Run this to verify the sandbox API works with the stored credentials
#

API_KEY="sbox_test_34fb6b033a9352b5227fd075dda18a98"
BASE_URL="http://localhost:3000/api/sandbox/oneroster"

echo "=== Testing MathGenius Learning Sandbox Credentials ==="
echo ""
echo "API Key: $API_KEY"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Students endpoint
echo "--- Test 1: GET /students?limit=3 ---"
curl -s -X GET "$BASE_URL/students?limit=3" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" | jq '.'
echo ""

# Test 2: Classes endpoint
echo "--- Test 2: GET /classes?limit=3 ---"
curl -s -X GET "$BASE_URL/classes?limit=3" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" | jq '.classes | length'
echo "classes returned"
echo ""

# Test 3: Enrollments endpoint
echo "--- Test 3: GET /enrollments?limit=3 ---"
curl -s -X GET "$BASE_URL/enrollments?limit=3" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" | jq '.enrollments | length'
echo "enrollments returned"
echo ""

# Test 4: Schools endpoint
echo "--- Test 4: GET /schools?limit=3 ---"
curl -s -X GET "$BASE_URL/schools?limit=3" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" | jq '.orgs | length'
echo "schools returned"
echo ""

# Test 5: Academic Sessions endpoint
echo "--- Test 5: GET /academicSessions ---"
curl -s -X GET "$BASE_URL/academicSessions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" | jq '.academicSessions | length'
echo "academic sessions returned"
echo ""

# Test 6: Invalid API key (should fail)
echo "--- Test 6: Invalid API key (should return 401) ---"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/students?limit=1" \
  -H "Authorization: Bearer invalid_key" \
  -H "Accept: application/json")
if [ "$RESPONSE" = "401" ]; then
  echo "PASS: Got expected 401 Unauthorized"
else
  echo "FAIL: Expected 401, got $RESPONSE"
fi
echo ""

echo "=== All Tests Complete ==="
