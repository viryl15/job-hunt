/**
 * Blacklist keyword checker
 * Checks if job title or description contains any blacklisted keywords
 */

/**
 * Keywords that should not be confused with each other
 * If user blacklists one, it should not match the other
 */
const CONFLICTING_KEYWORDS: Record<string, string[]> = {
  'Java': ['JavaScript', 'JS', 'TypeScript', 'TS', 'Node', 'Node.js'],
  'JavaScript': ['Java'],
  'TypeScript': ['Java'],
  'JS': ['Java'],
  'Node': ['Java'],
  'Node.js': ['Java'],
  'C': ['C++', 'C#', 'Objective-C'],
  'C++': ['C#'],
  'Python': ['TypeScript'], // Unlikely but prevents confusion
}

/**
 * Normalize text for matching (lowercase, remove extra spaces)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Check if text contains any blacklisted keywords
 * @param text - Job title or description to check
 * @param blacklistKeywords - Array of keywords to avoid
 * @returns Object with isBlacklisted flag and matched keywords
 */
export function checkBlacklistedKeywords(
  jobTitle: string,
  jobDescription: string,
  blacklistKeywords: string[]
): {
  isBlacklisted: boolean
  matchedKeywords: string[]
} {
  if (!blacklistKeywords || blacklistKeywords.length === 0) {
    return { isBlacklisted: false, matchedKeywords: [] }
  }

  const normalizedTitle = normalizeText(jobTitle)
  const normalizedDescription = normalizeText(jobDescription)
  const combinedText = `${normalizedTitle} ${normalizedDescription}`
  
  const matchedKeywords: string[] = []

  for (const keyword of blacklistKeywords) {
    const normalizedKeyword = normalizeText(keyword)
    
    // Check if this keyword has conflicting keywords that should prevent matching
    const conflictingKeywords = CONFLICTING_KEYWORDS[keyword] || []
    
    // If any conflicting keyword is found in the text, don't blacklist based on this keyword
    // Example: User blacklists "Java" but job mentions "JavaScript" - should NOT be blacklisted
    let hasConflict = false
    for (const conflictingKeyword of conflictingKeywords) {
      const conflictRegex = new RegExp(`\\b${escapeRegex(normalizeText(conflictingKeyword))}\\b`, 'i')
      if (conflictRegex.test(combinedText)) {
        hasConflict = true
        console.log(`   ℹ️  Blacklist keyword "${keyword}" not matched because conflicting keyword "${conflictingKeyword}" found in job`)
        break
      }
    }
    
    if (hasConflict) {
      continue // Skip this blacklist keyword
    }
    
    // Check if keyword appears as a whole word or phrase
    const keywordRegex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'i')
    
    if (keywordRegex.test(combinedText)) {
      // Additional check: For single-letter or very short keywords (like "C", "R", "Go"),
      // ensure they're not part of a larger tech term
      if (normalizedKeyword.length <= 2) {
        // Check if it's followed by special characters that indicate it's part of a longer term
        const extendedRegex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}[+#]`, 'i')
        if (extendedRegex.test(combinedText)) {
          // This is likely C++, C#, etc., not just "C"
          continue
        }
      }
      
      matchedKeywords.push(keyword)
    }
  }

  return {
    isBlacklisted: matchedKeywords.length > 0,
    matchedKeywords
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format blacklist check result for logging
 */
export function formatBlacklistResult(result: {
  isBlacklisted: boolean
  matchedKeywords: string[]
}): string {
  if (!result.isBlacklisted) {
    return '✅ No blacklisted keywords found'
  }
  
  return `🚫 BLACKLISTED - Found keywords: ${result.matchedKeywords.join(', ')}`
}
