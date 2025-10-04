'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  ListChecks,
  Loader2,
  AlertCircle
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
  const [appliedJobsData, setAppliedJobsData] = useState<any>(null)
  const [loadingApplications, setLoadingApplications] = useState(false)
  
  // New state for applications search and infinite scroll
  const [applicationsSearchTerm, setApplicationsSearchTerm] = useState('')
  const [applicationsPage, setApplicationsPage] = useState(1)
  const [loadingMoreApplications, setLoadingMoreApplications] = useState(false)
  const [hasMoreApplications, setHasMoreApplications] = useState(false)
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<string>('ALL')
  const applicationsEndRef = useRef<HTMLDivElement>(null)
  
  // Modal state for job details
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const fetchAppliedJobs = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMoreApplications(true)
      } else {
        setLoadingApplications(true)
        setApplicationsPage(1) // Reset page when not loading more
      }
      
      const page = loadMore ? applicationsPage + 1 : 1
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(applicationsSearchTerm && { search: applicationsSearchTerm }),
        ...(applicationsStatusFilter !== 'ALL' && { status: applicationsStatusFilter })
      })
      
      console.log('[Dashboard] Fetching applications with status filter:', applicationsStatusFilter, 'params:', params.toString())
      
      const response = await fetch(`/api/applied-jobs?${params}`)
      const data = await response.json()
      
      console.log('Applied jobs API response:', data)
      
      if (data.success) {
        if (loadMore && appliedJobsData) {
          // Append new applications to existing ones
          setAppliedJobsData({
            ...data.data,
            applications: [...appliedJobsData.applications, ...data.data.applications]
          })
        } else {
          // Replace applications
          setAppliedJobsData(data.data)
        }
        
        setHasMoreApplications(data.data.pagination?.hasMore || false)
        if (loadMore) {
          setApplicationsPage(page)
        }
        
        console.log('Applications count:', data.data?.applications?.length || 0)
      } else {
        console.error('API returned error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    } finally {
      setLoadingApplications(false)
      setLoadingMoreApplications(false)
    }
  }, [applicationsPage, applicationsSearchTerm, applicationsStatusFilter, appliedJobsData])

  // Update application status
  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the local state to reflect the change
        setAppliedJobsData((prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            applications: prev.applications.map((app: any) =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            ),
          }
        })
        
        // Update selected application if it's the one being edited
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication((prev: any) => ({ ...prev, status: newStatus }))
        }
        
        console.log('Application status updated successfully')
      } else {
        console.error('Failed to update status:', data.error)
        alert('Failed to update application status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Error updating application status. Please try again.')
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreApplications && !loadingMoreApplications) {
          fetchAppliedJobs(true)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = applicationsEndRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMoreApplications, loadingMoreApplications, fetchAppliedJobs])

  // Debounced search and filter for applications
  useEffect(() => {
    const timer = setTimeout(() => {
      if (applicationsSearchTerm !== undefined || applicationsStatusFilter !== 'ALL') {
        fetchAppliedJobs(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [applicationsSearchTerm, applicationsStatusFilter])

  useEffect(() => {
    fetchJobs()
    fetchAppliedJobs(false)
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
              <Link href="/test-hellowork">
                <Button variant="outline" size="sm">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Test Login
                </Button>
              </Link>
              <Link href="/automation-logs">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  View Logs
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
              <div className="text-2xl font-bold">{loadingApplications ? '...' : appliedJobsData?.statistics?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Total applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingApplications ? '...' : appliedJobsData?.statistics?.interview || 0}</div>
              <p className="text-xs text-muted-foreground">In interview process</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingApplications ? '...' : (appliedJobsData?.statistics?.offer || 0) + (appliedJobsData?.statistics?.hired || 0)}</div>
              <p className="text-xs text-muted-foreground">Offers & hired</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Job Search
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              My Applications ({appliedJobsData?.statistics?.total || 0})
            </TabsTrigger>
          </TabsList>

          {/* Job Search Tab */}
          <TabsContent value="search">
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
          <div className="flex justify-center gap-2 mt-6">
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
        )}
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications">
            {loadingApplications ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading applications...</p>
              </div>
            ) : appliedJobsData ? (
              <div className="space-y-6">
                {/* Application Statistics - Only show if we have applications and no active filters */}
                {appliedJobsData.applications.length > 0 && !applicationsSearchTerm && applicationsStatusFilter === 'ALL' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                          {appliedJobsData.statistics.applied}
                        </div>
                        <p className="text-xs text-muted-foreground">Applied</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {appliedJobsData.statistics.failed || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">
                          {appliedJobsData.statistics.screening}
                        </div>
                        <p className="text-xs text-muted-foreground">Screening</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                          {appliedJobsData.statistics.interview}
                        </div>
                        <p className="text-xs text-muted-foreground">Interviews</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {appliedJobsData.statistics.offer + appliedJobsData.statistics.hired}
                        </div>
                        <p className="text-xs text-muted-foreground">Offers/Hired</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Applications List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>All Applications</CardTitle>
                        <CardDescription>
                          {appliedJobsData.pagination?.total || appliedJobsData.applications.length} total applications
                        </CardDescription>
                      </div>
                    </div>
                    {/* Search and Filter */}
                    <div className="mt-4 flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search by job title, company, or location..."
                          value={applicationsSearchTerm}
                          onChange={(e) => setApplicationsSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={applicationsStatusFilter} onValueChange={setApplicationsStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="APPLIED">Applied</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="SCREEN">Screening</SelectItem>
                          <SelectItem value="TECH">Technical Interview</SelectItem>
                          <SelectItem value="ONSITE">Onsite Interview</SelectItem>
                          <SelectItem value="OFFER">Offer</SelectItem>
                          <SelectItem value="HIRED">Hired</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appliedJobsData.applications.length > 0 ? (
                  <>
                    {appliedJobsData.applications.map((application: any) => (
                      <div 
                        key={application.id} 
                        onClick={() => {
                          setSelectedApplication(application)
                          setIsModalOpen(true)
                        }}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                          application.status === 'FAILED' ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            {application.status === 'FAILED' && (
                              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{application.title || 'Job Title Unavailable'}</h3>
                              <p className="text-gray-600">{application.company || 'Company Name Unavailable'}</p>
                              {application.status === 'FAILED' && application.notes && (
                                <p className="text-sm text-red-600 mt-2 bg-red-100 p-2 rounded">
                                  <span className="font-semibold">Error: </span>
                                  {application.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(application.createdAt).toLocaleDateString()}
                                </span>
                                {application.locations && application.locations.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {application.locations[0]}
                                  </span>
                                )}
                                {application.salaryMin && application.salaryMax && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {application.salaryMin}k - {application.salaryMax}k {application.currency || 'EUR'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            application.status === 'HIRED' || application.status === 'OFFER' ? 'default' :
                            application.status === 'TECH' || application.status === 'ONSITE' ? 'secondary' :
                            application.status === 'SCREEN' ? 'secondary' :
                            application.status === 'APPLIED' ? 'outline' :
                            application.status === 'FAILED' || application.status === 'REJECTED' ? 'destructive' :
                            'outline'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {/* Infinite Scroll Loading Indicator */}
                    {loadingMoreApplications && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Loading more applications...</p>
                      </div>
                    )}
                    
                    {/* Intersection Observer Target */}
                    <div ref={applicationsEndRef} className="h-4" />
                    
                    {/* Show end message when no more results */}
                    {!hasMoreApplications && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          End of applications list
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {applicationsSearchTerm || applicationsStatusFilter !== 'ALL' 
                        ? 'No matching applications found' 
                        : 'No applications yet'}
                    </h3>
                    <p className="text-gray-500">
                      {applicationsSearchTerm || applicationsStatusFilter !== 'ALL'
                        ? 'Try adjusting your search terms or filters'
                        : 'Start applying to jobs to track your application progress here.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
              </div>

            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No applications yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start applying to jobs to track your application progress here.
                    </p>
                    <Link href="/auto-apply">
                      <Button>
                        <Zap className="h-4 w-4 mr-2" />
                        Start Auto Apply
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* Job Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedApplication.title || 'Job Details'}</DialogTitle>
                <DialogDescription>
                  {selectedApplication.company && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-lg font-semibold">{selectedApplication.company}</span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status Section */}
                <div className="border-b pb-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Application Status</label>
                  <Select 
                    value={selectedApplication.status} 
                    onValueChange={(newStatus) => updateApplicationStatus(selectedApplication.id, newStatus)}
                  >
                    <SelectTrigger className={`w-full ${
                      selectedApplication.status === 'HIRED' || selectedApplication.status === 'OFFER' ? 'border-green-500 text-green-700' :
                      selectedApplication.status === 'TECH' || selectedApplication.status === 'ONSITE' ? 'border-purple-500 text-purple-700' :
                      selectedApplication.status === 'SCREEN' ? 'border-yellow-500 text-yellow-700' :
                      selectedApplication.status === 'APPLIED' ? 'border-blue-500 text-blue-700' :
                      selectedApplication.status === 'FAILED' || selectedApplication.status === 'REJECTED' ? 'border-red-500 text-red-700' :
                      'border-gray-300 text-gray-700'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="APPLIED">Applied</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="SCREEN">Screening</SelectItem>
                      <SelectItem value="TECH">Tech Interview</SelectItem>
                      <SelectItem value="ONSITE">Onsite</SelectItem>
                      <SelectItem value="OFFER">Offer</SelectItem>
                      <SelectItem value="HIRED">Hired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Job Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Applied Date</label>
                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedApplication.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {selectedApplication.locations && selectedApplication.locations.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Location</label>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedApplication.locations.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {selectedApplication.salaryMin && selectedApplication.salaryMax && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Salary Range</label>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {selectedApplication.salaryMin}k - {selectedApplication.salaryMax}k {selectedApplication.currency || 'EUR'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Channel</label>
                    <p className="text-gray-600 mt-1">
                      {selectedApplication.channel || 'FORM'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedApplication.description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Job Description</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-60 overflow-y-auto">
                      {selectedApplication.description}
                    </div>
                  </div>
                )}

                {/* Notes / Error Message */}
                {selectedApplication.notes && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      {selectedApplication.status === 'FAILED' ? 'Error Message' : 'Notes'}
                    </label>
                    <div className={`mt-2 p-4 rounded-lg text-sm ${
                      selectedApplication.status === 'FAILED' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      {selectedApplication.notes}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedApplication.tags && selectedApplication.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedApplication.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedApplication.url && (
                    <Button 
                      onClick={() => window.open(selectedApplication.url, '_blank', 'noopener noreferrer')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {selectedApplication.status === 'FAILED' ? 'Retry Application' : 'View Job Posting'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}