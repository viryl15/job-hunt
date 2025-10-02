'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JOB_SOURCES } from '@/lib/job-scraper'

interface JobSourceSelectorProps {
  onScrape: (options: {
    sources: string[]
    location: string
    remoteOnly: boolean
    limit: number
  }) => Promise<void>
}

const LOCATION_OPTIONS = [
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Switzerland', label: 'Switzerland' }
]

export function JobSourceSelector({ onScrape }: JobSourceSelectorProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>(['indeed', 'linkedin'])
  const [location, setLocation] = useState('France')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [limit, setLimit] = useState(50)

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const handleScrape = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one job source')
      return
    }

    setIsLoading(true)
    try {
      await onScrape({
        sources: selectedSources,
        location,
        remoteOnly,
        limit
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Job Source Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job Sources */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Select Job Sources:</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(JOB_SOURCES).map(([key, source]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={selectedSources.includes(key)}
                  onCheckedChange={() => handleSourceToggle(key)}
                />
                <Label htmlFor={key} className="text-sm">
                  <span className="font-medium">{source.name}</span>
                  <br />
                  <span className="text-xs text-gray-600">{source.description}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location" className="text-sm font-medium">Location:</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit" className="text-sm font-medium">Max Results:</Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
              min={10}
              max={200}
              className="w-full"
            />
          </div>
        </div>

        {/* Remote Only Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remoteOnly"
            checked={remoteOnly}
            onCheckedChange={() => setRemoteOnly(!remoteOnly)}
          />
          <Label htmlFor="remoteOnly" className="text-sm">
            Remote positions only
          </Label>
        </div>

        {/* Scrape Button */}
        <Button 
          onClick={handleScrape} 
          disabled={isLoading || selectedSources.length === 0}
          className="w-full"
        >
          {isLoading ? 'Scraping Jobs...' : `Scrape Jobs from ${selectedSources.length} Source${selectedSources.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  )
}