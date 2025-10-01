import { JobItem, JobSource } from "./index";

interface RemoteOKJob {
  id: string;
  url: string;
  position: string;
  company: string;
  company_logo?: string;
  description: string;
  date: string;
  location?: string;
  tags: string[];
  original?: boolean;
}

export class RemoteOKAdapter implements JobSource {
  name = "RemoteOK";
  
  async fetch(opts: { q?: string; locations?: string[]; page?: number }): Promise<JobItem[]> {
    try {
      const baseUrl = "https://remoteok.com/api";
      
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'JobHuntPWA/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`RemoteOK API error: ${response.status}`);
      }
      
      const data = await response.json();
      // First item is metadata, skip it
      const jobs = data.slice(1) || [];
      
      // Filter jobs based on search criteria
      let filteredJobs = jobs.filter((job: RemoteOKJob) => job.original !== false);
      
      if (opts.q) {
        const keywords = opts.q.toLowerCase().split(/\s+|AND|OR/).map(k => k.trim()).filter(Boolean);
        filteredJobs = filteredJobs.filter((job: RemoteOKJob) => {
          const searchText = `${job.position} ${job.company} ${job.description} ${job.tags?.join(' ')}`.toLowerCase();
          return keywords.some(keyword => searchText.includes(keyword));
        });
      }
      
      if (opts.locations?.length) {
        const locationKeywords = opts.locations.map(loc => loc.toLowerCase());
        filteredJobs = filteredJobs.filter((job: RemoteOKJob) => {
          const jobLocation = (job.location || "").toLowerCase();
          const jobTags = (job.tags || []).map(tag => tag.toLowerCase());
          const jobText = `${jobLocation} ${jobTags.join(' ')}`.toLowerCase();
          
          return locationKeywords.some(loc => 
            jobText.includes(loc) || loc === "remote"
          );
        });
      }
      
      return filteredJobs.slice(0, 50).map((job: RemoteOKJob) => this.transformJob(job));
    } catch (error) {
      console.error("Error fetching from RemoteOK:", error);
      return [];
    }
  }
  
  private transformJob(job: RemoteOKJob): JobItem {
    return {
      externalId: job.id,
      title: job.position,
      company: job.company,
      url: `https://remoteok.com/jobs/${job.id}`,
      description: job.description,
      locations: job.location ? [job.location] : ["Remote"],
      remote: true, // RemoteOK is always remote
      postedAt: job.date,
      tags: job.tags || [],
    };
  }
}