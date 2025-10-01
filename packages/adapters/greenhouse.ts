import { JobItem, JobSource } from "./index";

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location: {
    name: string;
  };
  absolute_url: string;
  internal_job_id: number;
  departments: Array<{
    name: string;
  }>;
  offices: Array<{
    name: string;
  }>;
}

export class GreenhouseAdapter implements JobSource {
  name = "Greenhouse";
  
  // Curated list of tech companies using Greenhouse in EU
  private readonly companies = [
    "aircall",
    "algolia", 
    "contentsquare",
    "datadog",
    "doctolib",
    "ledger",
    "mirakl",
    "scaleway",
    "sendinblue",
    "typeform",
    "welovedevs",
  ];
  
  async fetch(opts: { q?: string; locations?: string[]; page?: number }): Promise<JobItem[]> {
    try {
      const allJobs: JobItem[] = [];
      
      // Fetch from multiple companies in parallel
      const promises = this.companies.map(company => this.fetchFromCompany(company));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          allJobs.push(...result.value);
        } else {
          console.warn(`Failed to fetch from ${this.companies[index]}:`, result.reason);
        }
      });
      
      return this.filterAndLimitJobs(allJobs, opts);
    } catch (error) {
      console.error("Error fetching from Greenhouse:", error);
      return [];
    }
  }
  
  private async fetchFromCompany(company: string): Promise<JobItem[]> {
    const baseUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
    
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'JobHuntPWA/1.0',
      },
    });
    
    if (!response.ok) {
      // Don't throw error, just return empty array for this company
      return [];
    }
    
    const data = await response.json();
    const jobs = data.jobs || [];
    
    return jobs.map((job: GreenhouseJob) => this.transformJob(job, company));
  }
  
  private transformJob(job: GreenhouseJob, company: string): JobItem {
    const department = job.departments?.[0]?.name || "";
    const office = job.offices?.[0]?.name || job.location.name;
    
    return {
      externalId: job.id.toString(),
      title: job.title,
      company: this.getDisplayName(company),
      url: job.absolute_url,
      locations: [office],
      remote: office.toLowerCase().includes("remote"),
      postedAt: job.updated_at,
      tags: department ? [department] : [],
    };
  }
  
  private filterAndLimitJobs(jobs: JobItem[], opts: { q?: string; locations?: string[] }): JobItem[] {
    let filtered = [...jobs];
    
    if (opts.q) {
      const keywords = opts.q.toLowerCase().split(/\s+|AND|OR/).map(k => k.trim()).filter(Boolean);
      filtered = filtered.filter(job => {
        const searchText = `${job.title} ${job.company} ${job.tags?.join(' ')}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }
    
    if (opts.locations?.length) {
      const locationKeywords = opts.locations.map(loc => loc.toLowerCase());
      filtered = filtered.filter(job => {
        const jobLocations = job.locations.map(loc => loc.toLowerCase()).join(' ');
        return locationKeywords.some(loc => 
          jobLocations.includes(loc) || 
          (loc === "remote" && job.remote)
        );
      });
    }
    
    return filtered.slice(0, 30);
  }
  
  private getDisplayName(company: string): string {
    const displayNames: Record<string, string> = {
      aircall: "Aircall",
      algolia: "Algolia",
      contentsquare: "ContentSquare",
      datadog: "Datadog",
      doctolib: "Doctolib",
      ledger: "Ledger",
      mirakl: "Mirakl",
      scaleway: "Scaleway",
      sendinblue: "Sendinblue",
      typeform: "Typeform",
      welovedevs: "WeLoveDevs",
    };
    
    return displayNames[company] || company;
  }
}