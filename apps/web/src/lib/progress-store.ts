// In-memory progress store for automation tracking
// Supports multiple concurrent automations
interface ProgressData {
  configId: string
  currentJob: number
  totalJobs: number
  currentJobTitle: string
  status: 'starting' | 'running' | 'completed' | 'failed'
  successCount: number
  failCount: number
}

// Store multiple automations by configId
const progressStore = new Map<string, ProgressData>()

export function updateProgress(data: ProgressData) {
  progressStore.set(data.configId, data)
}

export function getProgress(configId: string): ProgressData | null {
  return progressStore.get(configId) || null
}

export function getAllProgress(): ProgressData[] {
  return Array.from(progressStore.values())
}

export function clearProgress(configId: string) {
  progressStore.delete(configId)
}

export function initializeProgress(configId: string, totalJobs: number) {
  updateProgress({
    configId,
    currentJob: 0,
    totalJobs,
    currentJobTitle: 'Initializing...',
    status: 'starting',
    successCount: 0,
    failCount: 0
  })
}

