import { JobItem, JobSource, buildSearchQuery } from "./index";
import { RemotiveAdapter } from "./remotive";
import { RemoteOKAdapter } from "./remoteok";
import { AdzunaAdapter } from "./adzuna";
import { GreenhouseAdapter } from "./greenhouse";

export class JobAggregator {
  private adapters: JobSource[];
  
  constructor() {
    this.adapters = [
      new RemotiveAdapter(),
      new RemoteOKAdapter(),
      new AdzunaAdapter(),
      new GreenhouseAdapter(),
    ];
  }
  
  async fetchJobs(options: {
    skills: string[];
    locations: string[];
    page?: number;
  }): Promise<Array<JobItem & { source: string }>> {
    const query = buildSearchQuery(options.skills, options.locations);
    
    const fetchOptions = {
      q: query,
      locations: options.locations,
      page: options.page || 1,
    };
    
    try {
      // Fetch from all adapters in parallel
      const promises = this.adapters.map(async (adapter) => {
        try {
          const jobs = await adapter.fetch(fetchOptions);
          return jobs.map(job => ({
            ...job,
            source: adapter.name,
          }));
        } catch (error) {
          console.error(`Error fetching from ${adapter.name}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      const allJobs = results.flat();
      
      // Deduplicate jobs based on URL
      const uniqueJobs = this.deduplicateJobs(allJobs);
      
      // Sort by relevance (we'll implement proper scoring later)
      return uniqueJobs.sort((a, b) => {
        // Prioritize jobs with more relevant titles
        const aRelevance = this.calculateRelevance(a, options.skills);
        const bRelevance = this.calculateRelevance(b, options.skills);
        return bRelevance - aRelevance;
      });
    } catch (error) {
      console.error("Error in job aggregation:", error);
      return [];
    }
  }
  
  private deduplicateJobs(jobs: Array<JobItem & { source: string }>): Array<JobItem & { source: string }> {
    const seen = new Set<string>();
    const unique: Array<JobItem & { source: string }> = [];
    
    for (const job of jobs) {
      // Create a hash based on title, company, and normalized URL
      const normalizedUrl = job.url.replace(/[?#].*$/, '').toLowerCase();
      const hash = `${job.title.toLowerCase()}_${job.company.toLowerCase()}_${normalizedUrl}`;
      
      if (!seen.has(hash)) {
        seen.add(hash);
        unique.push(job);
      }
    }
    
    return unique;
  }
  
  private calculateRelevance(job: JobItem, skills: string[]): number {
    let score = 0;
    const searchText = `${job.title} ${job.description || ''} ${job.tags?.join(' ') || ''}`.toLowerCase();
    
    // Score based on skills mentioned
    for (const skill of skills) {
      if (searchText.includes(skill.toLowerCase())) {
        score += 1;
      }
    }
    
    // Bonus for remote jobs
    if (job.remote) {
      score += 0.5;
    }
    
    // Bonus for recent jobs
    if (job.postedAt) {
      const posted = new Date(job.postedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) {
        score += 1;
      } else if (daysDiff <= 30) {
        score += 0.5;
      }
    }
    
    return score;
  }
  
  getAvailableAdapters(): string[] {
    return this.adapters.map(adapter => adapter.name);
  }
}

// Export singleton instance
export const jobAggregator = new JobAggregator();