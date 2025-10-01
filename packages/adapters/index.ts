export interface JobItem {
  externalId?: string;
  title: string;
  company: string;
  url: string;
  description?: string;
  locations: string[];
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  postedAt?: string; // ISO date string
  tags?: string[]; // skills/technologies
}

export interface JobSource {
  name: string;
  fetch(opts: { 
    q?: string; 
    locations?: string[]; 
    page?: number;
    limit?: number;
  }): Promise<JobItem[]>;
}

export interface SearchOptions {
  keywords: string[];
  locations: string[];
  remote?: boolean;
  page?: number;
  limit?: number;
}

// Standard function to build search queries
export function buildSearchQuery(skills: string[], locations: string[]): string {
  const skillsQuery = skills.length > 0 ? skills.map(s => `"${s}"`).join(' OR ') : '';
  const locationsQuery = locations.length > 0 ? locations.join(' OR ') : '';
  
  if (skillsQuery && locationsQuery) {
    return `(${skillsQuery}) AND (${locationsQuery})`;
  }
  
  return skillsQuery || locationsQuery || 'developer';
}

// Export individual adapters
export { RemotiveAdapter } from "./remotive";
export { RemoteOKAdapter } from "./remoteok";
export { AdzunaAdapter } from "./adzuna";
export { GreenhouseAdapter } from "./greenhouse";
export { JobAggregator, jobAggregator } from "./aggregator";