'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  DollarSign, 
  Briefcase, 
  ExternalLink,
  Building2,
  Calendar,
  Clock,
  X
} from 'lucide-react'

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

interface JobDetailModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export default function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  const [isApplying, setIsApplying] = useState(false)

  if (!isOpen || !job) return null

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

  const handleApply = async () => {
    setIsApplying(true)
    
    // Simulate application process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would integrate with your application system
    alert(`Application sent for ${job.title} at ${job.company}!`)
    setIsApplying(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="relative">
            <Button
              variant="ghost" 
              size="sm"
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start gap-4 pr-12">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <Badge className={`px-2 py-1 text-sm font-medium ${getScoreColor(job.score)}`}>
                    {job.score} pts
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.remote ? 'Remote' : job.locations.join(', ')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatTimeAgo(job.postedAt)}
                  </div>
                </div>

                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-1 text-lg text-green-600 mb-4">
                    <DollarSign className="h-5 w-5" />
                    {formatSalary(job.salaryMin, job.salaryMax)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Tags */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <div>
                <h3 className="font-semibold mb-3">Job Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{job.description}</p>
                </div>
              </div>
            )}

            {/* Match Analysis */}
            <div>
              <h3 className="font-semibold mb-3">Why This Job Matches</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${job.score >= 80 ? 'bg-green-500' : job.score >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                  <span className="font-medium">Match Score: {job.score}/100</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Skills alignment with your profile</li>
                  <li>• Salary meets your expectations</li>
                  <li>• Location preferences match</li>
                  <li>• Company size and type fit</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                size="lg"
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1"
              >
                {isApplying ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Now'
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open(job.url, '_blank', 'noopener noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </Button>
              
              <Button variant="outline" size="lg">
                Save for Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}