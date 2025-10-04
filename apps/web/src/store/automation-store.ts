import { create } from 'zustand'

export interface AutomationProgress {
  configId: string
  configName: string
  currentJob: number
  totalJobs: number
  currentJobTitle: string
  status: 'starting' | 'running' | 'completed' | 'failed'
  successCount: number
  failCount: number
  skippedCount?: number
  startedAt: Date
  completedAt?: Date
}

interface AutomationStore {
  // Multiple automations running concurrently
  automations: Map<string, AutomationProgress>
  
  // Actions
  startAutomation: (configId: string, configName: string) => void
  updateAutomation: (configId: string, updates: Partial<AutomationProgress>) => void
  completeAutomation: (configId: string) => void
  failAutomation: (configId: string, error?: string) => void
  removeAutomation: (configId: string) => void
  clearCompleted: () => void
  
  // Getters
  getAutomation: (configId: string) => AutomationProgress | undefined
  isRunning: (configId: string) => boolean
  getRunningCount: () => number
  getAllAutomations: () => AutomationProgress[]
}

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  automations: new Map(),

  startAutomation: (configId: string, configName: string) => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      newAutomations.set(configId, {
        configId,
        configName,
        currentJob: 0,
        totalJobs: 0,
        currentJobTitle: 'Initializing...',
        status: 'starting',
        successCount: 0,
        failCount: 0,
        startedAt: new Date()
      })
      return { automations: newAutomations }
    })
  },

  updateAutomation: (configId: string, updates: Partial<AutomationProgress>) => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      const existing = newAutomations.get(configId)
      if (existing) {
        newAutomations.set(configId, { ...existing, ...updates })
      }
      return { automations: newAutomations }
    })
  },

  completeAutomation: (configId: string) => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      const existing = newAutomations.get(configId)
      if (existing) {
        newAutomations.set(configId, {
          ...existing,
          status: 'completed',
          completedAt: new Date(),
          currentJobTitle: '✅ Automation completed!'
        })
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Automation Completed!', {
            body: `${existing.configName}: ${existing.successCount} applications submitted successfully`,
            icon: '/favicon.svg',
            badge: '/favicon.svg'
          })
        }
      }
      return { automations: newAutomations }
    })
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      get().removeAutomation(configId)
    }, 10000)
  },

  failAutomation: (configId: string, error?: string) => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      const existing = newAutomations.get(configId)
      if (existing) {
        newAutomations.set(configId, {
          ...existing,
          status: 'failed',
          completedAt: new Date(),
          currentJobTitle: error || '❌ Automation failed'
        })
      }
      return { automations: newAutomations }
    })
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      get().removeAutomation(configId)
    }, 15000)
  },

  removeAutomation: (configId: string) => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      newAutomations.delete(configId)
      return { automations: newAutomations }
    })
  },

  clearCompleted: () => {
    set((state) => {
      const newAutomations = new Map(state.automations)
      Array.from(newAutomations.entries()).forEach(([id, automation]) => {
        if (automation.status === 'completed' || automation.status === 'failed') {
          newAutomations.delete(id)
        }
      })
      return { automations: newAutomations }
    })
  },

  getAutomation: (configId: string) => {
    return get().automations.get(configId)
  },

  isRunning: (configId: string) => {
    const automation = get().automations.get(configId)
    return automation?.status === 'starting' || automation?.status === 'running'
  },

  getRunningCount: () => {
    return Array.from(get().automations.values()).filter(
      (a) => a.status === 'starting' || a.status === 'running'
    ).length
  },

  getAllAutomations: () => {
    return Array.from(get().automations.values())
  }
}))

