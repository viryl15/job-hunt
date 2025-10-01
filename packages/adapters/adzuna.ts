import { JobItem, JobSource } from "./index";

interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  description: string;
  created: string;
  location: {
    display_name: string;
    area: string[];
  };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  category: {
    tag: string;
  };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export class AdzunaAdapter implements JobSource {
  name = "Adzuna";
  
  private readonly countries = {
    france: "fr",
    germany: "de",
    luxembourg: "lu",
  };
  
  async fetch(opts: { q?: string; locations?: string[]; page?: number }): Promise<JobItem[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    
    if (!appId || !appKey) {
      console.warn("Adzuna API credentials not configured");
      return [];
    }
    
    try {
      const allJobs: JobItem[] = [];
      
      // Search in relevant countries
      const targetCountries = this.getTargetCountries(opts.locations);
      
      for (const countryCode of targetCountries) {
        const jobs = await this.fetchFromCountry(countryCode, opts, appId, appKey);
        allJobs.push(...jobs);
      }
      
      return allJobs.slice(0, 50); // Limit total results
    } catch (error) {
      console.error("Error fetching from Adzuna:", error);
      return [];
    }
  }
  
  private getTargetCountries(locations?: string[]): string[] {
    if (!locations?.length) {
      return ["fr", "de"]; // Default to France and Germany
    }
    
    const countries = new Set<string>();
    
    locations.forEach(location => {
      const loc = location.toLowerCase();
      if (loc.includes("france") || loc.includes("paris")) {
        countries.add("fr");
      }
      if (loc.includes("germany") || loc.includes("berlin")) {
        countries.add("de");
      }
      if (loc.includes("luxembourg")) {
        countries.add("lu");
      }
    });
    
    return countries.size > 0 ? Array.from(countries) : ["fr", "de"];
  }
  
  private async fetchFromCountry(
    countryCode: string, 
    opts: { q?: string; locations?: string[]; page?: number },
    appId: string,
    appKey: string
  ): Promise<JobItem[]> {
    const page = opts.page || 1;
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;
    
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "20",
      what: opts.q || "developer software engineer",
      content_type: "application/json"
    });
    
    if (opts.locations?.length) {
      const whereQuery = opts.locations
        .filter(loc => !loc.toLowerCase().includes("remote"))
        .join(" OR ");
      if (whereQuery) {
        params.set("where", whereQuery);
      }
    }
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'JobHuntPWA/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Adzuna API error for ${countryCode}: ${response.status}`);
    }
    
    const data: AdzunaResponse = await response.json();
    return data.results.map(job => this.transformJob(job, countryCode));
  }
  
  private transformJob(job: AdzunaJob, countryCode: string): JobItem {
    return {
      externalId: job.id,
      title: job.title,
      company: job.company.display_name,
      url: job.redirect_url,
      description: job.description,
      locations: [job.location.display_name],
      remote: false, // Adzuna jobs are typically not remote
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: this.getCurrency(countryCode),
      postedAt: job.created,
      tags: [job.category.tag],
    };
  }
  
  private getCurrency(countryCode: string): string {
    switch (countryCode) {
      case "fr":
      case "de":
      case "lu":
        return "EUR";
      default:
        return "EUR";
    }
  }
}