'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { JOB_SOURCES } from '@/lib/job-scraper'
import { MapPin, Briefcase, Clock } from 'lucide-react'

interface JobSourceSelectorProps {
  onScrape: (options: ScrapeOptions) => void
  isLoading: boolean
}

interface ScrapeOptions {
  sources: string[]
  location: string
  remoteOnly: boolean
  limit: number
}

export function JobSourceSelector({ onScrape, isLoading }: JobSourceSelectorProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>(['remoteok', 'remotive'])
  const [location, setLocation] = useState('United States')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [limit, setLimit] = useState(50)

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const handleScrape = () => {
    onScrape({
      sources: selectedSources,
      location,
      remoteOnly,
      limit
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Job Source Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Job Sources Selection */}
        <div>
          <Label className="text-sm font-medium">Select Job Sources</Label>
          <div className="mt-3 space-y-3">
            {Object.entries(JOB_SOURCES).map(([id, source]) => (
              <div key={id} className="flex items-start space-x-3">
                <Checkbox
                  id={id}
                  checked={selectedSources.includes(id)}
                  onCheckedChange={() => handleSourceToggle(id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {source.name}
                    {source.remoteOnly && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Remote Only
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {source.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Location and Remote Preferences */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city, state, or country"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for location-based job sources (Indeed, LinkedIn)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote-only"
              checked={remoteOnly}
              onCheckedChange={(checked: boolean) => setRemoteOnly(checked)}
            />
            <Label htmlFor="remote-only" className="text-sm font-medium">
              Remote jobs only
            </Label>
          </div>
        </div>

        <Separator />

        {/* Results Limit */}
        <div>
          <Label htmlFor="limit" className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Results Limit
          </Label>
          <Input
            id="limit"
            type="number"
            min="10"
            max="500"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
            className="mt-2 w-32"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum number of jobs to fetch (10-500)
          </p>
        </div>

        {/* Scrape Button */}
        <Button
          onClick={handleScrape}
          disabled={isLoading || selectedSources.length === 0}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Scraping Jobs...
            </>
          ) : (
            `Scrape Jobs from ${selectedSources.length} Source${selectedSources.length === 1 ? '' : 's'}`
          )}
        </Button>

        {selectedSources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Please select at least one job source to continue
          </p>
        )}
      </CardContent>
    </Card>
  )
}