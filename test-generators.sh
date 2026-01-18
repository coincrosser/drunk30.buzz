#!/bin/bash
# Test Script for drunk30.buzz Generators
# Run this after: npm run dev
# Usage: bash test-generators.sh

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

echo "🧪 Testing drunk30.buzz Generators"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Outline Generator
echo -e "${YELLOW}Test 1: Outline Generator${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/outline" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Building a sustainable podcast workflow",
    "context": "For a solo creator learning to code"
  }')

if echo "$RESPONSE" | grep -q "hook"; then
  echo -e "${GREEN}✅ PASSED${NC}: Outline generator returned valid response"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED${NC}: Outline generator error"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# Test 2: Script Generator
echo -e "${YELLOW}Test 2: Script Generator${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/script" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Episode",
    "outline": "1. Introduction\n2. Main Point\n3. Conclusion",
    "targetDuration": 5
  }')

if echo "$RESPONSE" | grep -q "wordCount"; then
  echo -e "${GREEN}✅ PASSED${NC}: Script generator returned valid response"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED${NC}: Script generator error"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# Test 3: YouTube Pack Generator
echo -e "${YELLOW}Test 3: YouTube Pack Generator${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/youtube-pack" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Episode Title",
    "description": "Test description for the episode"
  }')

if echo "$RESPONSE" | grep -q "titles"; then
  echo -e "${GREEN}✅ PASSED${NC}: YouTube pack generator returned valid response"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED${NC}: YouTube pack generator error"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# Test 4: Missing API Key Error Handling
echo -e "${YELLOW}Test 4: Error Handling (Missing outline)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/script" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}')

if echo "$RESPONSE" | grep -q "error\|Missing"; then
  echo -e "${GREEN}✅ PASSED${NC}: Error handling works (rejects invalid input)"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED${NC}: Error handling not working properly"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC} | ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Check your .env.local:${NC}"
  echo "  - OPENAI_API_KEY must be set and valid"
  echo "  - DATABASE_URL must be set"
  echo "  - Server must be running (npm run dev)"
  exit 1
fi
