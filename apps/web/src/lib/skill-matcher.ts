/**
 * Skill Matching Algorithm
 * Compares user skills with job requirements (title + description)
 * Returns match percentage and details about matched/missing skills
 */

export interface SkillMatchResult {
  /** Overall match percentage (0-100) */
  percentage: number
  /** Skills that were found in the job text */
  matchedSkills: string[]
  /** Skills that were NOT found in the job text */
  missingSkills: string[]
  /** Details about how each skill was matched */
  matchDetails: {
    skill: string
    matchType: 'exact' | 'partial' | 'synonym' | 'none'
    foundAs?: string
  }[]
}

/**
 * Common tech skill synonyms and variations
 * Key: canonical name, Value: array of synonyms/variations
 */
const SKILL_SYNONYMS: Record<string, string[]> = {
  'JavaScript': ['JS', 'javascript', 'ECMAScript', 'ES6', 'ES2015', 'ES2020'],
  'Laravel': ['laravel'],
  'Symfony': ['symfony'],
  'TypeScript': ['TS', 'typescript'],
  'React': ['ReactJS', 'React.js', 'react'],
  'React Native': ['ReactNative', 'react-native'],
  'Vue': ['VueJS', 'Vue.js', 'vue'],
  'Angular': ['AngularJS', 'Angular.js', 'angular'],
  'Node': ['NodeJS', 'Node.js', 'node.js', 'node'],
  'Express': ['ExpressJS', 'Express.js', 'express'],
  'Next': ['NextJS', 'Next.js', 'next.js'],
  'Nuxt': ['NuxtJS', 'Nuxt.js', 'nuxt.js'],
  'MongoDB': ['Mongo', 'mongo', 'mongodb'],
  'PostgreSQL': ['Postgres', 'postgres', 'postgresql', 'PSQL', 'psql'],
  'MySQL': ['mysql', 'My SQL'],
  'SQL Server': ['MSSQL', 'MS SQL', 'SQLServer', 'sql-server'],
  'HTML': ['HTML5', 'html', 'html5'],
  'CSS': ['CSS3', 'css', 'css3'],
  'SASS': ['Sass', 'sass', 'SCSS', 'scss'],
  'Docker': ['docker', 'docker-compose', 'dockerfile'],
  'Kubernetes': ['K8s', 'k8s', 'kubernetes', 'kube'],
  'AWS': ['Amazon Web Services', 'amazon-web-services', 'aws'],
  'Azure': ['Microsoft Azure', 'azure', 'MS Azure'],
  'GCP': ['Google Cloud', 'Google Cloud Platform', 'gcp'],
  'Git': ['github', 'gitlab', 'bitbucket', 'git'],
  'CI/CD': ['CICD', 'Continuous Integration', 'Continuous Deployment', 'ci-cd'],
  'REST': ['REST API', 'RESTful', 'restful', 'rest-api'],
  'GraphQL': ['graphql', 'graph-ql', 'gql'],
  'Python': ['python', 'py'],
  'Java': ['java'],  // NOTE: Do NOT include JavaScript here - they are different!
  'C++': ['cpp', 'c plus plus', 'cplusplus'],
  'C#': ['csharp', 'c sharp', 'C Sharp', '.NET', 'dotnet'],
  'PHP': ['php'],
  'Ruby': ['ruby', 'Ruby on Rails', 'RoR', 'rails'],
  'Go': ['Golang', 'golang', 'go'],
  'Rust': ['rust'],
  'Swift': ['swift'],
  'Kotlin': ['kotlin'],
  'TDD': ['Test Driven Development', 'test-driven', 'tdd'],
  'Agile': ['Scrum', 'scrum', 'agile', 'kanban', 'Kanban'],
  'Redux': ['redux', 'Redux Toolkit'],
  'Tailwind': ['TailwindCSS', 'Tailwind CSS', 'tailwind'],
  'Bootstrap': ['bootstrap', 'Bootstrap'],
  'Material-UI': ['MUI', 'mui', 'material-ui', 'Material UI'],
  'Jest': ['jest'],
  'Cypress': ['cypress'],
  'Selenium': ['selenium'],
  'Webpack': ['webpack'],
  'Vite': ['vite'],
  'Babel': ['babel'],
  'ESLint': ['eslint', 'ES Lint'],
  'Prettier': ['prettier'],
  'Flutter': ['flutter'],
    'Dart': ['dart'],
    'FullStack': ['full stack', 'full-stack', 'fullstack'],
    'Backend': ['back end', 'back-end', 'backend'],
    'Frontend': ['front end', 'front-end', 'frontend'],
}

/**
 * Skills that should NOT match each other (conflicting technologies)
 * When checking for skill A, if skill B is in this list, A should NOT match B
 */
const CONFLICTING_SKILLS: Record<string, string[]> = {
  'Java': ['JavaScript', 'JS', 'javascript', 'TypeScript', 'TS'],
  'JavaScript': ['Java', 'java'],
  'TypeScript': ['Java', 'java'],
  'Node': ['Java', 'java'],
  'Node.js': ['Java', 'java'],
}

/**
 * Normalize a text string for comparison
 * Converts to lowercase and removes special characters
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

/**
 * Check if a skill appears in the job text
 * Returns match type and the exact text it was found as
 */
function findSkillInText(
  skill: string,
  jobText: string
): { found: boolean; matchType: 'exact' | 'partial' | 'synonym' | 'none'; foundAs?: string } {
  const normalizedJobText = normalizeText(jobText)
  const normalizedSkill = normalizeText(skill)

  // Check if this skill has conflicting skills that should be excluded
  const conflictingSkills = CONFLICTING_SKILLS[skill] || []
  
  // If any conflicting skill is found in the text, don't match this skill
  for (const conflictingSkill of conflictingSkills) {
    const conflictRegex = new RegExp(`\\b${escapeRegex(normalizeText(conflictingSkill))}\\b`, 'i')
    if (conflictRegex.test(normalizedJobText)) {
      // Found a conflicting skill, so this skill should NOT match
      // Example: User has "JavaScript" but job mentions "Java" - don't match JavaScript
      return { found: false, matchType: 'none' }
    }
  }

  // Check for exact match (whole word)
  const exactRegex = new RegExp(`\\b${escapeRegex(normalizedSkill)}\\b`, 'i')
  if (exactRegex.test(normalizedJobText)) {
    return { found: true, matchType: 'exact', foundAs: skill }
  }

  // Check for synonyms
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    const allVariations = [canonical, ...synonyms].map(s => normalizeText(s))
    
    // If the user's skill matches any variation
    if (allVariations.includes(normalizedSkill)) {
      // Check if any variation appears in the job text
      for (const variation of allVariations) {
        const synonymRegex = new RegExp(`\\b${escapeRegex(variation)}\\b`, 'i')
        if (synonymRegex.test(normalizedJobText)) {
          return { found: true, matchType: 'synonym', foundAs: variation }
        }
      }
    }
  }

  // REMOVED: Partial matching is too prone to false positives
  // Example: "java" would match "javascript" which is wrong
  // if (normalizedJobText.includes(normalizedSkill)) {
  //   return { found: true, matchType: 'partial', foundAs: skill }
  // }

  return { found: false, matchType: 'none' }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Calculate skill match percentage between user skills and job requirements
 * @param userSkills Array of skills from user's automation config
 * @param jobTitle Job title
 * @param jobDescription Job description
 * @returns Detailed match result with percentage and skill breakdown
 */
export function calculateSkillMatch(
  userSkills: string[],
  jobTitle: string,
  jobDescription: string
): SkillMatchResult {
  // Concatenate title and description for comprehensive matching
  const jobText = `${jobTitle} ${jobDescription}`

  if (!userSkills || userSkills.length === 0) {
    return {
      percentage: 0,
      matchedSkills: [],
      missingSkills: [],
      matchDetails: []
    }
  }

  const matchDetails: SkillMatchResult['matchDetails'] = []
  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  // Check each user skill against the job text
  for (const skill of userSkills) {
    const match = findSkillInText(skill, jobText)
    
    matchDetails.push({
      skill,
      matchType: match.matchType,
      foundAs: match.foundAs
    })

    if (match.found) {
      matchedSkills.push(skill)
    } else {
      missingSkills.push(skill)
    }
  }

  // Calculate percentage: (matched skills / total skills) * 100
  const percentage = Math.round((matchedSkills.length / userSkills.length) * 100)

  return {
    percentage,
    matchedSkills,
    missingSkills,
    matchDetails
  }
}

/**
 * Helper function to format match result for logging
 */
export function formatMatchResult(result: SkillMatchResult): string {
  const lines = [
    `Skill Match: ${result.percentage}%`,
    `Matched: ${result.matchedSkills.length}/${result.matchedSkills.length + result.missingSkills.length} skills`,
    '',
    '✅ Matched Skills:',
    ...result.matchedSkills.map(s => `  - ${s}`),
    '',
    '❌ Missing Skills:',
    ...result.missingSkills.map(s => `  - ${s}`),
  ]
  return lines.join('\n')
}
