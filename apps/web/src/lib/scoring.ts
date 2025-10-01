/**
 * Job scoring functions - deterministic scoring based on title, skills, location, and level
 * Score range: 0-100
 */

export interface JobItem {
  title: string;
  company: string;
  locations: string[];
  remote?: boolean;
  description?: string;
  tags?: string[];
}

export interface UserPreferences {
  skills: string[];
  locations: string[];
  experience?: 'junior' | 'mid' | 'senior';
  requiresVisa?: boolean;
}

const TITLE_REGEX = /(full[- ]?stack|backend|frontend|node|laravel|react|vue|typescript|javascript|python|java|golang|rust|flutter|mobile|devops|sre|platform)/i;

export function titleMatch(title: string): number {
  const matches = title.match(TITLE_REGEX);
  if (!matches) return 0;
  
  // Give higher scores for more specific matches
  const matchCount = matches.length;
  return Math.min(40, matchCount * 15);
}

export function skillOverlap(jobTags: string[], userSkills: string[]): number {
  if (!jobTags?.length || !userSkills?.length) return 0;
  
  const normalizedJobTags = new Set(jobTags.map(s => s.toLowerCase().trim()));
  const normalizedUserSkills = new Set(userSkills.map(s => s.toLowerCase().trim()));
  
  const intersection = [...normalizedJobTags].filter(tag => 
    [...normalizedUserSkills].some(skill => 
      tag.includes(skill) || skill.includes(tag)
    )
  );
  
  const union = new Set([...normalizedJobTags, ...normalizedUserSkills]);
  const jaccard = intersection.length / (union.size || 1);
  
  return Math.round(jaccard * 40);
}

export function locationFit(jobLocations: string[], userLocations: string[], isRemote = false): number {
  if (isRemote) return 10; // Remote jobs always get max location score
  
  if (!jobLocations?.length || !userLocations?.length) return 0;
  
  const normalizedJobLocs = jobLocations.map(l => l.toLowerCase());
  const normalizedUserLocs = userLocations.map(l => l.toLowerCase());
  
  const hasMatch = normalizedJobLocs.some(jobLoc =>
    normalizedUserLocs.some(userLoc =>
      jobLoc.includes(userLoc) || userLoc.includes(jobLoc)
    )
  );
  
  return hasMatch ? 10 : 0;
}

export function levelHint(description: string, userExperience?: string): number {
  if (!description) return 8; // Default mid-level score
  
  const desc = description.toLowerCase();
  
  // Senior level indicators
  if (/(senior|lead|principal|architect|8\+|10\+|expert)/i.test(desc)) {
    return userExperience === 'senior' ? 10 : 2;
  }
  
  // Junior level indicators
  if (/(junior|entry|graduate|intern|1-2|0-2)/i.test(desc)) {
    return userExperience === 'junior' ? 10 : 6;
  }
  
  // Mid-level is default
  return userExperience === 'mid' ? 10 : 8;
}

export function scoreJob(job: JobItem, prefs: UserPreferences): number {
  const titleScore = titleMatch(job.title);
  const skillScore = skillOverlap(job.tags || [], prefs.skills);
  const locationScore = locationFit(job.locations, prefs.locations, job.remote);
  const levelScore = levelHint(job.description || '', prefs.experience);
  
  return Math.min(100, titleScore + skillScore + locationScore + levelScore);
}

// Pipeline state machine
export const STAGES = ["LEAD", "APPLIED", "SCREEN", "TECH", "ONSITE", "OFFER", "HIRED", "REJECTED"] as const;
export type AppStatus = typeof STAGES[number];

export function canTransition(from: string, to: string): boolean {
  const fromIndex = STAGES.findIndex(stage => stage === from);
  const toIndex = STAGES.findIndex(stage => stage === to);
  
  if (fromIndex === -1 || toIndex === -1) return false;
  
  // Can always move to REJECTED or HIRED from any state
  if (to === "REJECTED" || to === "HIRED") return true;
  
  // Can move forward or stay in same state
  return toIndex >= fromIndex;
}

export function getNextStage(current: string): string | null {
  const currentIndex = STAGES.findIndex(stage => stage === current);
  if (currentIndex === -1 || currentIndex === STAGES.length - 1) return null;
  
  // Skip to next non-terminal stage
  const next = STAGES[currentIndex + 1];
  if (next === "HIRED" || next === "REJECTED") return null;
  
  return next;
}