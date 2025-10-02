// Test script for HelloWork automation with cookie consent handling
import { RealHelloWorkAutomator } from './src/lib/real-hellowork-automation'
import { JobBoardConfig } from './src/lib/database'

async function testHelloWorkWithCookies() {
  console.log('🚀 Testing HelloWork automation with cookie consent handling...')
  
  const testConfig: JobBoardConfig = {
    id: 'test-hellowork-cookies',
    name: 'HelloWork Cookie Test',
    enabled: true,
    credentials: {
      email: process.env.HELLOWORK_EMAIL || 'test@example.com',
      password: process.env.HELLOWORK_PASSWORD || 'testpassword'
    },
    applicationSettings: {
      maxApplicationsPerDay: 5,
      resumeUrl: '',
      coverLetterTemplate: 'Test cover letter for HelloWork'
    },
    searchCriteria: {
      keywords: ['développeur', 'javascript'],
      location: 'Paris',
      maxDistance: 50
    }
  }
  
  const automator = new RealHelloWorkAutomator(testConfig)
  
  try {
    // Test login process which should handle cookie consent
    console.log('📋 Testing login with cookie consent handling...')
    const loginResult = await automator.login()
    
    if (loginResult) {
      console.log('✅ Login successful with cookie handling!')
      
      // Test logout
      await automator.logout()
      console.log('✅ Test completed successfully!')
    } else {
      console.log('❌ Login failed')
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testHelloWorkWithCookies()
}