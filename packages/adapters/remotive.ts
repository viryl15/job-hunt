import { JobItem, JobSource } from "./index";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  description: string;
  publication_date: string;
  candidate_required_location?: string;
  salary?: string;
  job_type: string;
  tags?: string[];
}

export class RemotiveAdapter implements JobSource {
  name = "Remotive";
  
  async fetch(opts: { q?: string; locations?: string[]; page?: number }): Promise<JobItem[]> {
    try {
      const baseUrl = "https://remotive.com/api/remote-jobs";
      const params = new URLSearchParams();
      
      if (opts.q) {
        params.set("search", opts.q);
      }
      
      if (opts.locations?.length) {
        // Remotive uses category filtering, we'll search for location in the query
        const locationQuery = opts.locations.join(" OR ");
        const fullQuery = opts.q ? `${opts.q} AND (${locationQuery})` : locationQuery;
        params.set("search", fullQuery);
      }
      
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'JobHuntPWA/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Remotive API error: ${response.status}`);
      }
      
      const data = await response.json();
      const jobs = data.jobs || [];
      
      return jobs.map((job: RemotiveJob) => this.transformJob(job));
    } catch (error) {
      console.error("Error fetching from Remotive:", error);
      return [];
    }
  }
  
  private transformJob(job: RemotiveJob): JobItem {
    return {
      externalId: job.id.toString(),
      title: job.title,
      company: job.company_name,
      url: job.url,
      description: job.description,
      locations: job.candidate_required_location 
        ? [job.candidate_required_location] 
        : ["Remote"],
      remote: true, // Remotive is always remote
      postedAt: job.publication_date,
      tags: job.tags || [job.category],
    };
  }
}