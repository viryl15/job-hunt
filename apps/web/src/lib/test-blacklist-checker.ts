/**
 * Test cases for blacklist checker
 * Demonstrates behavior with conflicting keywords like Java vs JavaScript
 */

import { checkBlacklistedKeywords, formatBlacklistResult } from './blacklist-checker'

console.log('🧪 Testing Blacklist Checker\n')
console.log('=' .repeat(60))

// Test Case 1: Java blacklisted, job mentions JavaScript
console.log('\n📋 Test Case 1: Blacklist "Java", job mentions "JavaScript"')
const test1 = checkBlacklistedKeywords(
  'Senior JavaScript Developer',
  'We are looking for a JavaScript developer with Node.js experience',
  ['Java']
)
console.log('Result:', formatBlacklistResult(test1))
console.log('Expected: ✅ Not blacklisted (JavaScript is different from Java)')
console.log('Actual:', test1.isBlacklisted ? '❌ BLACKLISTED' : '✅ NOT BLACKLISTED')

// Test Case 2: Java blacklisted, job mentions Java
console.log('\n📋 Test Case 2: Blacklist "Java", job mentions "Java"')
const test2 = checkBlacklistedKeywords(
  'Senior Java Developer',
  'We are looking for a Java developer with Spring Boot experience',
  ['Java']
)
console.log('Result:', formatBlacklistResult(test2))
console.log('Expected: 🚫 Blacklisted')
console.log('Actual:', test2.isBlacklisted ? '🚫 BLACKLISTED' : '✅ NOT BLACKLISTED')

// Test Case 3: JavaScript blacklisted, job mentions Java
console.log('\n📋 Test Case 3: Blacklist "JavaScript", job mentions "Java"')
const test3 = checkBlacklistedKeywords(
  'Java Backend Engineer',
  'Looking for Java developer with microservices experience',
  ['JavaScript']
)
console.log('Result:', formatBlacklistResult(test3))
console.log('Expected: ✅ Not blacklisted (Java is different from JavaScript)')
console.log('Actual:', test3.isBlacklisted ? '❌ BLACKLISTED' : '✅ NOT BLACKLISTED')

// Test Case 4: Java blacklisted, job mentions both Java and JavaScript
console.log('\n📋 Test Case 4: Blacklist "Java", job mentions BOTH "Java" and "JavaScript"')
const test4 = checkBlacklistedKeywords(
  'Full Stack Developer',
  'We need someone with Java backend and JavaScript frontend experience',
  ['Java']
)
console.log('Result:', formatBlacklistResult(test4))
console.log('Expected: ✅ Not blacklisted (JavaScript takes precedence as conflicting keyword)')
console.log('Actual:', test4.isBlacklisted ? '❌ BLACKLISTED' : '✅ NOT BLACKLISTED')

// Test Case 5: Multiple blacklist keywords
console.log('\n📋 Test Case 5: Blacklist ["senior", "management"], job mentions "senior"')
const test5 = checkBlacklistedKeywords(
  'Senior Software Engineer',
  'Looking for a senior developer with 10+ years experience',
  ['senior', 'management']
)
console.log('Result:', formatBlacklistResult(test5))
console.log('Expected: 🚫 Blacklisted (contains "senior")')
console.log('Actual:', test5.isBlacklisted ? '🚫 BLACKLISTED' : '✅ NOT BLACKLISTED')
console.log('Matched keywords:', test5.matchedKeywords)

// Test Case 6: C vs C++ vs C#
console.log('\n📋 Test Case 6: Blacklist "C", job mentions "C++"')
const test6 = checkBlacklistedKeywords(
  'C++ Developer',
  'We are looking for an experienced C++ developer for game development',
  ['C']
)
console.log('Result:', formatBlacklistResult(test6))
console.log('Expected: ✅ Not blacklisted (C++ is different from C)')
console.log('Actual:', test6.isBlacklisted ? '❌ BLACKLISTED' : '✅ NOT BLACKLISTED')

// Test Case 7: Word boundary test
console.log('\n📋 Test Case 7: Blacklist "senior", job mentions "seniority"')
const test7 = checkBlacklistedKeywords(
  'Mid-level Developer',
  'We value seniority and experience in our team culture',
  ['senior']
)
console.log('Result:', formatBlacklistResult(test7))
console.log('Expected: ✅ Not blacklisted (word boundary protection)')
console.log('Actual:', test7.isBlacklisted ? '❌ BLACKLISTED' : '✅ NOT BLACKLISTED')

console.log('\n' + '='.repeat(60))
console.log('\n✅ All tests completed!\n')
