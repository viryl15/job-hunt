import { RemotiveAdapter } from './sources/remotive'
import { RemoteOkAdapter } from './sources/remoteok'

interface JobSourceAdapter {
  name: string
  fetchJobs(): Promise<any[]>
}

const adapters: JobSourceAdapter[] = [
  new RemotiveAdapter(),
  new RemoteOkAdapter(),
]

export async function ingestJobsFromSources() {
  const results = {
    totalFetched: 0,
    totalIngested: 0,
    errors: [] as string[],
    sources: {} as Record<string, { fetched: number; ingested: number; errors: string[] }>
  }

  for (const adapter of adapters) {
    console.log(`Fetching jobs from ${adapter.name}...`)
    
    try {
      const jobs = await adapter.fetchJobs()
      results.totalFetched += jobs.length
      results.sources[adapter.name] = {
        fetched: jobs.length,
        ingested: 0,
        errors: []
      }

      // Ingest jobs via API
      for (const job of jobs) {
        try {
          const response = await fetch('http://localhost:3000/api/jobs/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job)
          })

          if (response.ok) {
            results.totalIngested++
            results.sources[adapter.name].ingested++
          } else {
            const error = await response.text()
            results.sources[adapter.name].errors.push(`Failed to ingest job: ${error}`)
          }
        } catch (error) {
          const errorMsg = `Error ingesting job from ${adapter.name}: ${error}`
          results.sources[adapter.name].errors.push(errorMsg)
          results.errors.push(errorMsg)
        }
      }
    } catch (error) {
      const errorMsg = `Error fetching from ${adapter.name}: ${error}`
      results.errors.push(errorMsg)
      results.sources[adapter.name] = {
        fetched: 0,
        ingested: 0,
        errors: [errorMsg]
      }
    }
  }

  return results
}

// CLI script
if (require.main === module) {
  ingestJobsFromSources()
    .then(results => {
      console.log('\n=== Job Ingestion Results ===')
      console.log(`Total Fetched: ${results.totalFetched}`)
      console.log(`Total Ingested: ${results.totalIngested}`)
      console.log(`Success Rate: ${((results.totalIngested / results.totalFetched) * 100).toFixed(1)}%`)
      
      console.log('\n=== Source Breakdown ===')
      Object.entries(results.sources).forEach(([source, data]) => {
        console.log(`${source}: ${data.ingested}/${data.fetched} (${data.errors.length} errors)`)
      })
      
      if (results.errors.length > 0) {
        console.log('\n=== Errors ===')
        results.errors.forEach(error => console.log(`- ${error}`))
      }
    })
    .catch(error => {
      console.error('Ingestion failed:', error)
      process.exit(1)
    })
}