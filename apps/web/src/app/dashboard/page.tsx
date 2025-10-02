'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Star, 
  Filter,
  ExternalLink,
  Building2,
  Calendar,
  Users,
  Settings,
  Zap,
  Home
} from 'lucide-react'
import Link from 'next/link'
import { JobSourceSelector } from '@/components/JobSourceSelector'

interface Job {
  id: string
  title: string
  company: string
  locations: string[]
  remote: boolean
  url: string
  description?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  tags: string[]
  score: number
  postedAt: string
  createdAt: string
}

interface JobsResponse {
  success: boolean
  data: {
    jobs: Job[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [isScrapingJobs, setIsScrapingJobs] = useState(false)
  const [showSourceSelector, setShowSourceSelector] = useState(false)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/jobs?${params}`)
      const data: JobsResponse = await response.json()
      
      if (data.success) {
        setJobs(data.data.jobs)
        setTotalJobs(data.data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const scrapeRealJobs = async (options: {
    sources: string[]
    location: string
    remoteOnly: boolean
    limit: number
  }) => {
    setIsScrapingJobs(true)
    try {
      const response = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Successfully scraped ${result.data.newJobs} new real jobs from ${options.sources.join(', ')}!`)
        // Refresh the job list
        fetchJobs()
      } else {
        alert(`❌ Scraping failed: ${result.details || result.error}`)
      }
    } catch (error) {
      console.error('Scraping error:', error)
      alert('❌ Failed to scrape jobs. Check console for details.')
    } finally {
      setIsScrapingJobs(false)
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just posted'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Job Hunt</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auto-apply">
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Apply
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Dev Mode
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">Available positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Applications sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18%</div>
              <p className="text-xs text-muted-foreground">Employer responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67</div>
              <p className="text-xs text-muted-foreground">Match quality</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Search</CardTitle>
            <CardDescription>
              Find your perfect job match from {totalJobs} available positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs by title, company, or skills..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowSourceSelector(!showSourceSelector)}
                variant={showSourceSelector ? "default" : "outline"}
                className="flex-1 sm:flex-none"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showSourceSelector ? 'Hide' : 'Configure'} Job Sources
              </Button>
              <Button variant="outline" size="sm">
                Clear Test Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Source Selector */}
        {showSourceSelector && (
          <div className="mb-6">
            <JobSourceSelector 
              onScrape={scrapeRealJobs}
            />
          </div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <Badge className={`px-2 py-1 text-xs font-medium ${getScoreColor(job.score)}`}>
                          {job.score} pts
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.remote ? 'Remote' : job.locations?.join(', ')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatTimeAgo(job.postedAt)}
                        </div>
                      </div>

                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center gap-1 text-sm text-green-600 mb-3">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags?.slice(0, 6).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {job.tags?.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.tags.length - 6} more
                          </Badge>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {job.description.length > 200 ? 
                            `${job.description.substring(0, 200)}...` : 
                            job.description
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="default" size="sm">
                        Apply Now
                      </Button>
                      <Button variant="outline" size="sm">
                        Save Job
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(job.url, '_blank', 'noopener noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Page {currentPage}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}