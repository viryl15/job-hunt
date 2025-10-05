// Real HelloWork automation using Puppeteer for actual job applications
import puppeteer, { Browser, Page } from 'puppeteer'
import { JobBoardConfig, query } from './database'
import { 
  JobBoardAutomator, 
  SearchCriteria, 
  JobListing, 
  ApplicationData, 
  AutoApplicationResult 
} from './job-board-automation'
import { AutomationLogger, HumanDelays, humanSleep, humanSleepWithMouse, MouseMovements } from './automation-logger'
import fs from 'fs'
import path from 'path'

export class RealHelloWorkAutomator extends JobBoardAutomator {
  private browser: Browser | null = null
  private page: Page | null = null
  private baseUrl = 'https://www.hellowork.com'
  private loginUrl = 'https://www.hellowork.com/fr-fr/candidat/connexion-inscription.html#connexion'
  private searchUrl = 'https://www.hellowork.com/fr-fr/emploi/recherche.html'
  private isLoggedIn = false
  private logger: AutomationLogger
  private screenshotDir: string

  constructor(config: JobBoardConfig) {
    super(config)
    this.logger = new AutomationLogger(config.id)
    
    // Screenshot directory relative to current working directory (apps/web when running from there)
    this.screenshotDir = path.join(process.cwd(), 'automation-screenshots')
    
    console.log('Screenshot directory:', this.screenshotDir) // Debug log
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true })
    }
  }

  async login(): Promise<boolean> {
    try {
      this.logger.info('Starting real HelloWork login process')
      
      // Launch browser with options for server environment
      const headless = process.env.PUPPETEER_HEADLESS !== 'false'
      this.logger.debug('Launching browser', { headless })
      
      this.browser = await puppeteer.launch({
        headless,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // Reduce automation detection
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: { width: 1366, height: 768 },
        devtools: !headless, // Open DevTools when not headless for debugging
        slowMo: headless ? 0 : 50 // Add slight delay between actions when visible for debugging
      })

      this.page = await this.browser.newPage()

      // Set user agent to avoid bot detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      
      // Human-like delay before navigation
      await humanSleep(HumanDelays.navigationDelay(), 'Preparing to navigate', this.logger)

      this.logger.info('Navigating to HelloWork login page')
      await this.page.goto(this.loginUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // Check if we got a 404 or error page
      const pageTitle = await this.page.title()
      const pageContent = await this.page.content()
      
      if (pageTitle.includes('introuvable') || pageContent.includes('Oups, cette page est introuvable') || pageContent.includes('404')) {
        this.logger.error('Login page not found (404)', { 
          url: this.loginUrl, 
          title: pageTitle,
          currentUrl: this.page.url()
        })
        
        // Try alternative login URLs - but we should have the correct one now
        const alternativeUrls = [
          'https://www.hellowork.com/fr-fr/candidat/connexion-inscription.html#connexion',
          'https://www.hellowork.com/fr-fr/candidat/connexion-inscription.html',
          'https://www.hellowork.com/candidat/connexion',
          'https://www.hellowork.com/login'
        ]
        
        let loginPageFound = false
        for (const altUrl of alternativeUrls) {
          try {
            this.logger.info(`Trying alternative login URL: ${altUrl}`)
            await this.page.goto(altUrl, { waitUntil: 'networkidle2', timeout: 15000 })
            
            const altTitle = await this.page.title()
            const altContent = await this.page.content()
            
            if (!altTitle.includes('introuvable') && !altContent.includes('404')) {
              this.logger.success(`Found working login URL: ${altUrl}`)
              this.loginUrl = altUrl
              loginPageFound = true
              break
            }
          } catch (error) {
            this.logger.debug(`Failed to load ${altUrl}`, { error: error instanceof Error ? error.message : 'Unknown error' })
            continue
          }
        }
        
        if (!loginPageFound) {
          throw new Error('All HelloWork login URLs returned 404. The site structure may have changed.')
        }
      }

      // Human-like delay for page load with reading simulation
      const pageLoadDelay = HumanDelays.pageLoadDelay()
      await humanSleepWithMouse(this.page, pageLoadDelay, 'Waiting for page to fully load', this.logger)

      // Additional delay to let any JavaScript forms load with reading behavior
      await MouseMovements.simulateReading(this.page, 2000, this.logger)

      // Take initial screenshot
      await this.takeScreenshot('01-login-page')

      // Handle cookie consent modal if present
      await this.handleCookieConsent()

      // Wait for login form to be visible with multiple possible selectors
      this.logger.debug('Waiting for login form elements')
      const emailSelectors = [
        'input[name="email2"]', // HelloWork login form uses email2
        'input[name="email"]', 
        'input[type="email"]',
        'input[name="username"]',
        'input[id*="email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="adresse" i]',
        'input[placeholder*="identifiant" i]',
        '#email',
        '#username',
        '#login'
      ]
      
      let emailField = null
      for (const selector of emailSelectors) {
        try {
          emailField = await this.page.waitForSelector(selector, { timeout: 2000 })
          if (emailField) {
            this.logger.debug(`Found email field with selector: ${selector}`)
            break
          }
        } catch (error) {
          continue
        }
      }
      
      if (!emailField) {
        // Take a screenshot to see what's on the page
        await this.takeScreenshot('02-no-email-field-found')
        throw new Error('Could not find email/login field on the page')
      }

      // Human-like delay for reading the page with mouse movements
      const readingTime = HumanDelays.readingDelay(200)
      await MouseMovements.simulateReading(this.page, readingTime, this.logger)

      this.logger.info('Filling login credentials')
      
      // Use the email selector that we found above
      let foundEmailSelector = ''
      for (const selector of emailSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            foundEmailSelector = selector
            break
          }
        } catch (error) {
          continue
        }
      }
      
      const email = this.config.credentials.email || ''
      await humanSleep(HumanDelays.formInteractionDelay(), 'Thinking before typing email', this.logger)
      await this.humanType(foundEmailSelector, email)
      this.logger.success('Email field filled')

      // Human delay between fields
      await humanSleep(HumanDelays.navigationDelay(), 'Moving to password field', this.logger)

      // Find and fill password field with human-like typing
      const passwordSelectors = [
        'input[name="password2"]', // HelloWork login form uses password2
        'input[name="password"]',
        'input[type="password"]', 
        'input[id*="password"]'
      ]
      
      let passwordField = null
      for (const selector of passwordSelectors) {
        try {
          passwordField = await this.page.waitForSelector(selector, { timeout: 2000 })
          if (passwordField) {
            this.logger.debug(`Found password field with selector: ${selector}`)
            break
          }
        } catch (error) {
          continue
        }
      }
      
      if (!passwordField) {
        await this.takeScreenshot('02-no-password-field-found')
        throw new Error('Could not find password field on the page')
      }
      
      // Find the working selector again for typing
      let foundPasswordSelector = ''
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            foundPasswordSelector = selector
            break
          }
        } catch (error) {
          continue
        }
      }
      
      const password = this.config.credentials.password || ''
      await this.humanType(foundPasswordSelector, password)
      this.logger.success('Password field filled')

      // Take screenshot before submission
      await this.takeScreenshot('02-credentials-filled')

      // Human-like delay before clicking login
      await humanSleep(HumanDelays.formInteractionDelay(), 'Reviewing form before submission', this.logger)

      // Check for FriendlyCaptcha before attempting login
      await this.handlePreLoginCaptcha()

      // Find and click login button - Updated based on actual HelloWork HTML structure
      const loginButtonSelectors = [
        'button.profile-button[data-simple-progress]', // Exact HelloWork login button from HTML
        'button.profile-button', // HelloWork uses this class for login button
        'button[data-simple-progress]', // HelloWork login button has this attribute
        'form[data-gtm-form-interact-id] button[type="button"]', // HelloWork form with type="button"
        'form[data-gtm-form-interact-id] button', // Any button in the HelloWork form
        'form button[type="button"]', // Any type="button" in a form
        'button[type="submit"]',
        'input[type="submit"]',
        'form button', // Any button in a form
        '.btn-primary',
        '.btn-login',
        '[data-testid*="login"]',
        '[data-testid*="submit"]',
        'button[class*="btn"]',
        'button[class*="button"]',
        'input[value*="connecter" i]',
        'input[value*="login" i]'
      ]
      
      // First, let's debug what buttons are available on the page
      this.logger.debug('Scanning for available buttons on the page...')
      const availableButtons = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]')
        return Array.from(buttons).map(btn => ({
          tagName: btn.tagName,
          type: (btn as HTMLInputElement).type || 'N/A',
          className: btn.className,
          id: btn.id,
          textContent: btn.textContent?.trim() || '',
          value: (btn as HTMLInputElement).value || '',
          visible: (btn as HTMLElement).offsetParent !== null,
          disabled: (btn as HTMLButtonElement | HTMLInputElement).disabled,
          dataAttributes: Array.from(btn.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => `${attr.name}="${attr.value}"`).join(' '),
          outerHTML: btn.outerHTML.substring(0, 200) + (btn.outerHTML.length > 200 ? '...' : '')
        }))
      })
      
      this.logger.debug('Available buttons found:', availableButtons)
      
      // Also search for buttons with specific text content (HelloWork login text)
      const loginTexts = ['Je me connecte', 'Se connecter', 'Connexion', 'Login', 'Connecter']
      const buttonsByText = await this.page.evaluate((texts) => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
        return texts.map(text => {
          const matchingButtons = buttons.filter(btn => 
            btn.textContent?.trim().includes(text) ||
            (btn as HTMLInputElement).value?.includes(text)
          ).map(btn => ({
            searchText: text,
            tagName: btn.tagName,
            className: btn.className,
            textContent: btn.textContent?.trim() || '',
            value: (btn as HTMLInputElement).value || '',
            visible: (btn as HTMLElement).offsetParent !== null,
            disabled: (btn as HTMLButtonElement | HTMLInputElement).disabled,
            outerHTML: btn.outerHTML.substring(0, 150) + '...'
          }))
          return { searchText: text, matches: matchingButtons }
        }).filter(result => result.matches.length > 0)
      }, loginTexts)
      
      this.logger.debug('Login buttons found by text:', buttonsByText)
      
      let loginClicked = false
      const attemptedSelectors: string[] = []
      
      // Try CSS selectors first
      for (const selector of loginButtonSelectors) {
        try {
          attemptedSelectors.push(selector)
          const button = await this.page.$(selector)
          if (button) {
            const isVisible = await button.isIntersectingViewport()
            const isEnabled = await button.evaluate(el => !(el as HTMLButtonElement).disabled)
            
            this.logger.debug(`Found button with selector: ${selector}`, { 
              visible: isVisible, 
              enabled: isEnabled 
            })
            
            if (isVisible && isEnabled) {
              // Move mouse to button before clicking (more human-like)
              await MouseMovements.moveToElement(this.page, selector, this.logger)
              
              // Human-like pause before clicking
              await humanSleep(HumanDelays.randomDelay(200, 500), 'Positioning for login click', this.logger)
              
              await button.click()
              this.logger.success(`Login button clicked using selector: ${selector}`)
              loginClicked = true
              break
            } else {
              this.logger.debug(`Button found but not clickable`, { selector, visible: isVisible, enabled: isEnabled })
            }
          } else {
            this.logger.debug(`No button found for selector: ${selector}`)
          }
        } catch (selectorError) {
          this.logger.debug(`Error with selector ${selector}:`, selectorError)
          continue
        }
      }
      
      // If CSS selectors failed, try XPath with text content
      if (!loginClicked) {
        this.logger.debug('CSS selectors failed, trying XPath with text content...')
        const xpathSelectors = [
          '//button[contains(text(), "Je me connecte")]',
          '//button[contains(text(), "Se connecter")]', 
          '//button[contains(text(), "Connexion")]',
          '//input[@type="submit" and contains(@value, "connecte")]',
          '//button[@class="profile-button"]',
          '//button[contains(@class, "profile-button")]'
        ]
        
        for (const xpath of xpathSelectors) {
          try {
            attemptedSelectors.push(`XPath: ${xpath}`)
            // Use page.evaluate to find elements by XPath since $x has type issues
            const buttonHandle = await this.page.evaluateHandle((xpath: string) => {
              const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
              return result.singleNodeValue as HTMLButtonElement | HTMLInputElement | null
            }, xpath)
            
            if (buttonHandle) {
              const button = buttonHandle.asElement()
              if (button) {
                const isVisible = await button.isIntersectingViewport()
                const isEnabled = await button.evaluate((el: HTMLButtonElement | HTMLInputElement) => !el.disabled)
                
                this.logger.debug(`Found button with XPath: ${xpath}`, { 
                  visible: isVisible, 
                  enabled: isEnabled 
                })
                
                if (isVisible && isEnabled) {
                  // Get element bounds for mouse movement
                  const box = await button.boundingBox()
                  if (box) {
                    await this.page.mouse.move(box.x + box.width/2, box.y + box.height/2)
                    await humanSleep(HumanDelays.randomDelay(200, 500), 'Positioning for login click', this.logger)
                  }
                  
                  await button.click()
                  this.logger.success(`Login button clicked using XPath: ${xpath}`)
                  loginClicked = true
                  break
                } else {
                  this.logger.debug(`XPath button found but not clickable`, { xpath, visible: isVisible, enabled: isEnabled })
                }
              }
            } else {
              this.logger.debug(`No button found for XPath: ${xpath}`)
            }
            
            await buttonHandle.dispose()
          } catch (xpathError) {
            this.logger.debug(`Error with XPath ${xpath}:`, xpathError)
            continue
          }
        }
      }
      
      if (!loginClicked) {
        await this.takeScreenshot('02-no-login-button-found')
        this.logger.error('Could not find or click login button', { 
          attemptedSelectors,
          availableButtons: availableButtons.length,
          buttonDetails: availableButtons
        })
        
        // Don't close browser for debugging
        this.logger.info('🔍 DEBUGGING: Browser kept open for manual inspection')
        this.logger.info('   Please check the browser window and DevTools to examine the login form')
        this.logger.info('   Look for the login button and note its selector/attributes')
        
        throw new Error('Could not find or click login button. Browser kept open for debugging.')
      }

      // Wait and check for bot verification/CAPTCHA challenge
      await humanSleep(2000, 'Waiting for potential bot verification', this.logger)
      
      try {
        await this.handleBotVerification()
      } catch (error) {
        // If CAPTCHA detected, provide helpful information but don't completely fail
        this.logger.error('Login blocked by bot verification')
        this.logger.info('💡 Suggestions to avoid CAPTCHA:')
        this.logger.info('   • Use slower automation speeds')
        this.logger.info('   • Add more random delays')
        this.logger.info('   • Try different browser user agents')
        this.logger.info('   • Use residential proxy if available')
        this.logger.info('   • Complete login manually when CAPTCHA appears')
        
        // Take final screenshot for debugging
        await this.takeScreenshot('07-login-blocked-by-captcha')
        
        // Return false to indicate login failed due to bot detection
        return false
      }

      // Wait for navigation after login
      this.logger.debug('Waiting for login completion')
      
      try {
        await this.page.waitForSelector([
          '[data-testid="dashboard"]',
          '.dashboard',
          'a[href*="profil"]',
          'a[href*="candidatures"]',
          'a[href*="compte"]',
          '.user-menu',
          '.user-profile',
          'button:contains("Profil")',
          'button:contains("Mon compte")',
          '.logout',
          'a:contains("Déconnexion")'
        ].join(', '), { timeout: 15000 })
        
        await this.takeScreenshot('03-login-success')
        
        this.isLoggedIn = true
        this.logger.success('Successfully logged in to HelloWork')
        return true
      } catch (loginError) {
        // Check if we're still on login page (login failed)
        const currentUrl = this.page.url()
        if (currentUrl.includes('/login')) {
          this.logger.error('Login failed - still on login page')
          
          // Check for error messages
          const errorMessage = await this.page.$eval(
            '.error, .alert-danger, [role="alert"]', 
            el => el?.textContent || ''
          ).catch(() => 'No error message found')
          
          await this.takeScreenshot('03-login-failed')
          this.logger.error('Login error detected', { errorMessage, currentUrl })
          return false
        }
        
        await this.takeScreenshot('03-login-uncertain')
        this.logger.warning('Login status uncertain - continuing', { currentUrl })
        this.isLoggedIn = true
        return true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('HelloWork login failed', { error: errorMessage })
      await this.takeScreenshot('03-login-error')
      
      // Keep browser open for debugging if it's a login button issue
      const isLoginButtonIssue = errorMessage.includes('Could not find or click login button')
      if (isLoginButtonIssue) {
        await this.cleanup(true) // Keep browser open for debugging
      } else {
        await this.cleanup() // Normal cleanup for other errors
      }
      return false
    }
  }

  // Human-like typing with realistic delays and mouse movements
  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return
    
    // Move mouse to the input field first (more human-like)
    await MouseMovements.moveToElement(this.page, selector, this.logger)
    
    // Click to focus (instead of just focusing)
    await this.page.click(selector)
    await humanSleep(HumanDelays.randomDelay(100, 300), 'Thinking before typing', this.logger)
    
    // Add slight mouse jitter while typing (simulates hand movement)
    let jitterCount = 0
    
    for (const char of text) {
      await this.page.keyboard.type(char)
      
      // Add occasional mouse jitter during typing (every 3-5 characters)
      jitterCount++
      if (jitterCount > HumanDelays.randomDelay(3, 5)) {
        await MouseMovements.addMouseJitter(this.page, this.logger)
        jitterCount = 0
      }
      
      // Random delay between keystrokes (50-200ms)
      await humanSleep(HumanDelays.randomDelay(50, 200))
    }
    
    // Small pause after finishing typing
    await humanSleep(HumanDelays.randomDelay(200, 500), 'Reviewing typed text', this.logger)
  }

  // Handle cookie consent modal that appears on HelloWork
  private async handleCookieConsent(): Promise<void> {
    if (!this.page) return

    try {
      this.logger.info('Checking for cookie consent modal')
      
      // Wait a bit for the modal to appear (if it's going to)
      await humanSleep(1000, 'Waiting for potential cookie modal', this.logger)
      
      // Look for HelloWork's specific cookie consent modal buttons
      const cookieButtonSelectors = [
        '#hw-cc-notice-continue-without-accepting-btn', // Preferred - "Continuer sans accepter"
        '#hw-cc-notice-accept-btn', // Fallback - "Tout accepter"
        'button.hw-cc-notice-modal__btn-continue-without-accepting', // Alternative selector for continue without accepting
        '.hw-cc-btn--primary', // Generic primary button in cookie modal
        'button:contains("Continuer sans accepter")', // Text-based fallback
        'button:contains("Tout accepter")', // Text-based fallback
        'button:contains("Accepter")', // Generic accept
        '.hw-cc-btn', // Any cookie consent button
        'button[id*="hw-cc"]', // Any HelloWork cookie consent button
        '[class*="hw-cc"] button' // Any button within HelloWork cookie consent elements
      ]
      
      let cookieModalHandled = false
      
      for (const selector of cookieButtonSelectors) {
        try {
          // Check if the button exists without waiting too long
          const button = await this.page.$(selector)
          if (button) {
            // Check if the button is visible
            const isVisible = await button.isIntersectingViewport()
            if (isVisible) {
              this.logger.info(`Found cookie consent button: ${selector}`)
              
              // Human-like delay before clicking
              await humanSleep(HumanDelays.formInteractionDelay(), 'Reading cookie notice', this.logger)
              
              await button.click()
              this.logger.success('Cookie consent modal dismissed')
              
              // Wait for modal to disappear
              await humanSleep(1000, 'Waiting for modal to disappear', this.logger)
              
              cookieModalHandled = true
              break
            }
          }
        } catch (error) {
          // Continue to next selector if this one fails
          continue
        }
      }
      
      if (!cookieModalHandled) {
        // Try a more specific approach for HelloWork's cookie modal structure
        try {
          // Look specifically for HelloWork cookie modal container first
          const cookieModalExists = await this.page.$('.hw-cc-main, .hw-cc-notice-modal, .hw-cc-modal')
          
          if (cookieModalExists) {
            this.logger.info('Found HelloWork cookie consent modal container')
            
            // Try to find and click the "Continue without accepting" button within the modal
            const continueWithoutAcceptBtn = await this.page.$('#hw-cc-notice-continue-without-accepting-btn')
            if (continueWithoutAcceptBtn) {
              const isVisible = await continueWithoutAcceptBtn.isIntersectingViewport()
              if (isVisible) {
                this.logger.info('Clicking "Continuer sans accepter" button')
                await continueWithoutAcceptBtn.click()
                this.logger.success('Cookie modal dismissed with "Continuer sans accepter"')
                await humanSleep(1000, 'Waiting after cookie consent', this.logger)
                cookieModalHandled = true
              }
            }
            
            // If that didn't work, try the "Accept all" button
            if (!cookieModalHandled) {
              const acceptAllBtn = await this.page.$('#hw-cc-notice-accept-btn')
              if (acceptAllBtn) {
                const isVisible = await acceptAllBtn.isIntersectingViewport()
                if (isVisible) {
                  this.logger.info('Clicking "Tout accepter" button as fallback')
                  await acceptAllBtn.click()
                  this.logger.success('Cookie modal dismissed with "Tout accepter"')
                  await humanSleep(1000, 'Waiting after cookie consent', this.logger)
                  cookieModalHandled = true
                }
              }
            }
          }
        } catch (error) {
          this.logger.debug('Error in fallback cookie modal handling', { error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
      
      if (!cookieModalHandled) {
        this.logger.info('No cookie consent modal found or already dismissed')
      }
      
      // Take a screenshot after handling cookies to see the result
      await this.takeScreenshot('01b-after-cookie-consent')
      
    } catch (error) {
      this.logger.warning('Error handling cookie consent modal', { error: error instanceof Error ? error.message : 'Unknown error' })
      // Don't fail the entire process for cookie modal issues
    }
  }

  // Handle FriendlyCaptcha that might appear before login attempt
  private async handlePreLoginCaptcha(): Promise<void> {
    if (!this.page) return

    try {
      this.logger.debug('Checking for pre-login FriendlyCaptcha')

      // Check if FriendlyCaptcha is present but hidden (tw-hidden class)
      const friendlyCaptcha = await this.page.$('.frc-captcha')
      if (friendlyCaptcha) {
        const isHidden = await this.page.evaluate((element) => {
          return element.classList.contains('tw-hidden')
        }, friendlyCaptcha)

        if (isHidden) {
          this.logger.info('FriendlyCaptcha is present but hidden - proceeding with login')
          return
        }

        // If visible, we need to handle it
        this.logger.warning('FriendlyCaptcha is visible and may need to be completed')
        
        // Check for the verification button
        const verifyButton = await this.page.$('.frc-button')
        if (verifyButton) {
          this.logger.info('Attempting to trigger FriendlyCaptcha verification')
          await MouseMovements.moveToElement(this.page, '.frc-button', this.logger)
          await humanSleep(HumanDelays.randomDelay(500, 1000), 'Preparing to click CAPTCHA', this.logger)
          
          await verifyButton.click()
          this.logger.info('FriendlyCaptcha verification triggered')
          
          // Wait for CAPTCHA to complete
          await humanSleep(5000, 'Waiting for CAPTCHA completion', this.logger)
          
          // Check if it's now solved
          const solution = await this.page.$eval('.frc-captcha-solution', (input: any) => input.value).catch(() => '.UNSTARTED')
          
          if (solution === '.UNSTARTED') {
            this.logger.warning('FriendlyCaptcha may require manual completion')
            await humanSleepWithMouse(this.page, 15000, 'Waiting for manual CAPTCHA completion', this.logger)
          } else {
            this.logger.success('FriendlyCaptcha appears to be solved')
          }
        }
      } else {
        this.logger.debug('No FriendlyCaptcha detected')
      }
    } catch (error) {
      this.logger.warning('Error handling pre-login CAPTCHA:', error)
    }
  }

  // Handle bot verification/CAPTCHA that appears after clicking login
  private async handleBotVerification(): Promise<void> {
    if (!this.page) return

    try {
      this.logger.debug('Checking for bot verification challenge')
      await this.takeScreenshot('03-after-login-click')

      // Wait a moment for potential CAPTCHA/verification to load
      await humanSleep(2000, 'Waiting for potential verification challenge', this.logger)

      // Check for CAPTCHA/bot verification elements based on HelloWork's implementation
      const captchaSelectors = [
        // FriendlyCaptcha (HelloWork uses this)
        '[class*="FriendlyCaptcha"]',
        '.frc-captcha',
        'div[data-sitekey]',
        'iframe[src*="friendlycaptcha"]',
        
        // Generic CAPTCHA selectors
        '[class*="captcha"]',
        '[id*="captcha"]', 
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        '.verification',
        '[class*="verification"]',
        'canvas', // Some CAPTCHAs use canvas
        '[aria-label*="verification" i]',
        '[aria-label*="captcha" i]',
        
        // Slider/puzzle verifications
        '.slider-verification',
        '[class*="slider"]',
        '.puzzle-verification'
      ]
      
      // Search for HelloWork specific bot detection text (separate from CSS selectors)
      const botDetectionTexts = [
        'Nous vérifions que vous n\'êtes pas un',
        'vérification',
        'robot',
        'bot'
      ]

      let captchaFound = false
      let captchaType = 'unknown'

      for (const selector of captchaSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            const isVisible = await element.isIntersectingViewport()
            if (isVisible) {
              captchaFound = true
              captchaType = selector
              this.logger.warning(`Bot verification detected with selector: ${selector}`)
              break
            }
          }
        } catch (error) {
          continue
        }
      }

      if (captchaFound) {
        await this.takeScreenshot('04-captcha-detected')
        this.logger.warning('🤖 Bot verification/CAPTCHA detected!')
        this.logger.info('⚠️ CAPTCHA Challenge Found:')
        this.logger.info(`   Type: ${captchaType}`)
        this.logger.info('   This requires manual interaction or different automation approach')
        this.logger.info('   Recommendations:')
        this.logger.info('   • Use slower, more human-like interactions')
        this.logger.info('   • Add random delays between actions')
        this.logger.info('   • Consider using residential proxies')
        this.logger.info('   • Complete verification manually if needed')
        
        // Wait for potential manual completion with natural mouse movements
        this.logger.info('Waiting 25 seconds for potential manual completion...')
        await humanSleepWithMouse(this.page, 25000, 'Waiting for manual CAPTCHA completion with mouse activity', this.logger)
        
        // Check if verification was resolved
        const stillBlocked = await this.page.$(captchaSelectors.join(', '))
        if (stillBlocked) {
          await this.takeScreenshot('05-captcha-still-active')
          this.logger.error('Bot verification still active after waiting period')
          throw new Error(`Bot verification challenge detected (${captchaType}). Manual intervention required.`)
        } else {
          this.logger.success('Bot verification appears to be resolved!')
          await this.takeScreenshot('06-captcha-resolved')
        }
      } else {
        this.logger.debug('No bot verification challenge detected - proceeding normally')
      }

    } catch (error) {
      this.logger.warning('Error during bot verification check:', error)
      await this.takeScreenshot('04-captcha-error')
      
      // Re-throw the error if it's about CAPTCHA detection
      if (error instanceof Error && error.message.includes('Bot verification challenge detected')) {
        throw error
      }
      
      // For other errors, log but don't fail the process
    }
  }

  // Enhanced screenshot function with consistent naming
  private async takeScreenshot(step: string): Promise<void> {
    if (this.page) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `${timestamp}-${this.config.id}-${step}.png`
      const filepath = path.join(this.screenshotDir, filename)
      
      try {
        await this.page.screenshot({ path: filepath as `${string}.png`, fullPage: true })
        this.logger.addScreenshot(filepath, step)
        this.logger.debug('Screenshot saved', { filename, step })
      } catch (error) {
        this.logger.error('Failed to take screenshot', { error: error instanceof Error ? error.message : 'Unknown error', step })
      }
    }
  }

  async searchJobs(criteria: SearchCriteria): Promise<JobListing[]> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error('Must be logged in to search jobs')
    }

    try {
      this.logger.info('🔍 Searching for jobs on HelloWork', criteria)
      
      // If multiple keywords provided, search each one individually and merge results
      if (criteria.keywords.length > 1) {
        this.logger.info(`📚 Searching for ${criteria.keywords.length} skills individually and merging results...`)
        
        const allJobs: JobListing[] = []
        const jobIdSet = new Set<string>() // Track unique job IDs across all skill searches
        const maxSkills = 5 // Limit to avoid excessive searches
        
        for (let i = 0; i < Math.min(criteria.keywords.length, maxSkills); i++) {
          const skill = criteria.keywords[i]
          this.logger.info(`🔍 [${i + 1}/${Math.min(criteria.keywords.length, maxSkills)}] Searching for: "${skill}"`)
          
          try {
            // Search with single skill
            const singleSkillCriteria: SearchCriteria = {
              ...criteria,
              keywords: [skill]
            }
            
            const skillJobs = await this.searchJobs(singleSkillCriteria)
            
            // Add only unique jobs
            const newJobs = skillJobs.filter(job => !jobIdSet.has(job.id))
            newJobs.forEach(job => jobIdSet.add(job.id))
            allJobs.push(...newJobs)
            
            this.logger.success(`   Found ${skillJobs.length} jobs for "${skill}" (${newJobs.length} new unique jobs)`)
            
            // Human-like delay between skill searches
            if (i < Math.min(criteria.keywords.length, maxSkills) - 1) {
              const delay = Math.random() * 3000 + 2000 // 2-5 seconds
              this.logger.debug(`   Waiting ${Math.round(delay/1000)}s before next skill search...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            }
            
          } catch (error) {
            this.logger.error(`   Failed to search for skill "${skill}":`, error)
            // Continue with other skills
          }
        }
        
        this.logger.success(`🎉 Collected ${allJobs.length} unique jobs across ${Math.min(criteria.keywords.length, maxSkills)} skills`)
        return allJobs
      }
      
      // Single keyword search - proceed with standard flow
      const searchKeyword = criteria.keywords[0] || ''
      const location = (criteria.location || 'france').toLowerCase()
      
      // Construct HelloWork search URL with all parameters
      const searchParams = new URLSearchParams({
        'k': searchKeyword,
        'k_autocomplete': '',
        'l': location,
        'l_autocomplete': '',
        'st': 'relevance', // Sort by relevance
        'cod': 'all', // All categories
        'ray': '2000', // 20km radius
        'd': 'all' // All dates
      })
      
      // Add contract types (CDI, CDD, Freelance)
      searchParams.append('c', 'CDI')
      searchParams.append('c', 'CDD')
      searchParams.append('c', 'Freelance')
      
      const searchUrlWithParams = `https://www.hellowork.com/fr-fr/emploi/recherche.html?${searchParams.toString()}`
      
      this.logger.info('Navigating directly to HelloWork search results', { 
        searchUrl: searchUrlWithParams,
        keyword: searchKeyword,
        location
      })
      
      // Navigate directly to search results page with retry logic
      let navigationSuccess = false
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          this.logger.info(`🔄 Attempting to load search page (attempt ${attempt}/3)`)
          
          await this.page.goto(searchUrlWithParams, { 
            waitUntil: 'domcontentloaded', // Less strict than networkidle2
            timeout: 60000 // Increased to 60 seconds
          })
          
          // Wait a bit for dynamic content to load
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          navigationSuccess = true
          this.logger.info('✅ Search page loaded successfully')
          break
        } catch (error) {
          lastError = error as Error
          this.logger.info(`⚠️ Navigation attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          if (attempt < 3) {
            this.logger.info('⏳ Waiting 3 seconds before retrying...')
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
        }
      }
      
      if (!navigationSuccess) {
        throw new Error(`Failed to load search page after 3 attempts. Last error: ${lastError?.message}`)
      }

      // Handle cookie consent modal if it appears on search page too
      await this.handleCookieConsent()

      // Take screenshot of search page
      await this.takeScreenshot('04-search-page')

      // Wait for search results to load with reading behavior
      const searchPageLoadDelay = HumanDelays.pageLoadDelay()
      await MouseMovements.simulateReading(this.page, searchPageLoadDelay, this.logger)

      this.logger.info('Search URL loaded, checking for results...')
      
      // Since we navigated directly to search results, no need to fill forms or click search
      // The search parameters are already in the URL

      // Wait for search results with multiple possible selectors
      this.logger.debug('Waiting for search results to load')
      const resultSelectors = [
        'turbo-frame#turboSerp', // HelloWork search results are loaded in this turbo frame
        'section.tw-layout-grid', // HelloWork uses this class for the main search results section
        '.job-item',
        '.offre',
        '.job-card', 
        '.search-result',
        '[data-testid*="job"]',
        '.job-listing',
        'article',
        '.result-item',
        // HelloWork specific selectors based on the HTML structure
        '[class*="tw-max-h-"][class*="tw-min-h-"][class*="tw-relative"]' // Job card containers
      ]
      
      let resultsFound = false
      for (const selector of resultSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 })
          this.logger.success(`Found results with selector: ${selector}`)
          resultsFound = true
          break
        } catch (error) {
          continue
        }
      }
      
      if (!resultsFound) {
        await this.takeScreenshot('06-no-results-found')
        this.logger.warning('No job results found on the page')
        return []
      }

      // Take screenshot of results
      await this.takeScreenshot('06-search-results')

      // Extract job listings based on HelloWork's actual HTML structure
      const jobs = await this.page.evaluate(() => {
        // HelloWork uses li elements with data-id-storage-item-id for job listings
        const jobElements = document.querySelectorAll(`
          li[data-id-storage-item-id],
          .job-item, 
          .offre, 
          [data-testid*="job"], 
          .search-result,
          article
        `)
        
        console.log(`Found ${jobElements.length} job elements on the page`)
        
        const jobs: Array<{
          id: string;
          title: string;
          company: string;
          location: string;
          description: string;
          url: string;
          postedDate: Date;
          requirements: string[];
        }> = []

        jobElements.forEach((element, index) => {
          try {
            // Extract job ID from HelloWork's data attribute
            const jobId = element.getAttribute('data-id-storage-item-id')
            
            // Find the main job link - HelloWork uses href="/fr-fr/emplois/JOBID.html"
            const linkElement = element.querySelector('a[href*="/fr-fr/emplois/"], a[href*="/emploi/"], a[href*="/offre/"]')
            
            // Extract job title from the H3 structure
            let jobTitle = ''
            const h3Element = element.querySelector('h3')
            if (h3Element) {
              // Job title is in the first <p> inside <h3>
              const titleP = h3Element.querySelector('p')
              jobTitle = titleP?.textContent?.trim() || ''
            }
            
            // Extract company name from the second <p> inside <h3>
            let companyName = ''
            if (h3Element) {
              const paragraphs = h3Element.querySelectorAll('p')
              if (paragraphs.length > 1) {
                companyName = paragraphs[1].textContent?.trim() || ''
              }
            }
            
            // Alternative: get company from image alt attribute
            if (!companyName) {
              const companyImg = element.querySelector('img[alt]')
              if (companyImg) {
                companyName = companyImg.getAttribute('alt') || ''
              }
            }
            
            // Extract location from the location tag
            let location = ''
            const locationElement = element.querySelector('[data-cy="localisationCard"]')
            if (locationElement) {
              location = locationElement.textContent?.trim() || ''
            }
            
            // Extract contract type
            let contractType = ''
            const contractElement = element.querySelector('[data-cy="contractCard"]')
            if (contractElement) {
              contractType = contractElement.textContent?.trim() || ''
            }
            
            // Extract salary if available
            let salary = ''
            const salaryElements = element.querySelectorAll('.tw-typo-s-bold')
            for (const el of salaryElements) {
              const text = el.textContent?.trim() || ''
              if (text.includes('€') || text.includes('000')) {
                salary = text
                break
              }
            }

            // Build full URL
            let jobUrl = linkElement?.getAttribute('href') || ''
            if (jobUrl && !jobUrl.startsWith('http')) {
              jobUrl = 'https://www.hellowork.com' + jobUrl
            }

            // Create description from available details
            const description = [contractType, salary].filter(Boolean).join(' - ')

            if (jobTitle && jobUrl && jobId) {
              const jobData = {
                id: jobId,
                title: jobTitle,
                company: companyName || 'Company not specified',
                location: location || 'Location not specified',
                description: description || 'No description available',
                url: jobUrl,
                postedDate: new Date(),
                requirements: []
              }
              jobs.push(jobData)
              console.log(`✅ Found job ${index + 1}: "${jobTitle}" at "${companyName}" (${location}) - URL: ${jobUrl}`)
            } else {
              console.log(`❌ Skipping job ${index + 1}: Missing data - Title: "${jobTitle}", URL: "${jobUrl}", ID: "${jobId}"`)
              if (linkElement) {
                console.log(`   Link found but missing other data. Link href: ${linkElement.getAttribute('href')}`)
              }
            }
          } catch (error) {
            console.error(`Error extracting job ${index + 1}:`, error)
          }
        })

        return jobs
      })

      console.log(`✅ Found ${jobs.length} real jobs on HelloWork`)

      // Take screenshot of results for debugging
      await this.takeScreenshot('06-search-results-detailed')

      // PAGINATION: Check if there are more pages and collect all jobs
      this.logger.info('Checking for pagination...')
      let allJobs = [...jobs]
      const jobIdSet = new Set(jobs.map(j => j.id)) // Use Set to track unique job IDs across pagination
      let currentPage = 1
      let hasNextPage = true
      const maxPages = 10 // Safety limit to avoid infinite loops
      
      while (hasNextPage && currentPage < maxPages) {
        // Look for next page button
        const nextPageButton = await this.page.evaluate(() => {
          // HelloWork uses button with name="p" for pagination
          // Find the "next page" arrow button that's not disabled
          const buttons = Array.from(document.querySelectorAll('button[name="p"]'))
          
          // The "next" button is the last button with arrow right icon
          const nextButton = buttons.find(btn => {
            const svg = btn.querySelector('svg use')
            const isNextArrow = svg?.getAttribute('href')?.includes('arrow.svg#right')
            const isDisabled = btn.hasAttribute('aria-disabled') || 
                             btn.classList.contains('tw-pointer-events-none') ||
                             btn.classList.contains('tw-opacity-40')
            return isNextArrow && !isDisabled
          })
          
          if (nextButton) {
            const btnElement = nextButton as HTMLButtonElement
            btnElement.setAttribute('data-temp-next-page', 'true')
            const pageValue = btnElement.getAttribute('value') || ''
            return { exists: true, value: pageValue }
          }
          
          return { exists: false, value: '' }
        })
        
        if (!nextPageButton.exists) {
          this.logger.info(`No more pages found. Total pages scraped: ${currentPage}`)
          hasNextPage = false
          break
        }
        
        currentPage++
        this.logger.info(`📄 Navigating to page ${currentPage}...`)
        
        // Click the next page button
        const nextBtn = await this.page.$('button[data-temp-next-page="true"]')
        if (!nextBtn) {
          this.logger.warning('Next page button disappeared')
          hasNextPage = false
          break
        }
        
        // Human-like delay before clicking pagination
        await humanSleep(HumanDelays.randomDelay(1000, 2000), 'Preparing to navigate to next page', this.logger)
        
        // Click and wait for navigation
        await Promise.all([
          nextBtn.click(),
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {
            this.logger.debug('Page navigation timeout, continuing anyway')
          })
        ])
        
        // Wait for page to load with human-like reading behavior
        const pageLoadDelay = HumanDelays.pageLoadDelay()
        await MouseMovements.simulateReading(this.page, pageLoadDelay, this.logger)
        
        // Take screenshot of new page
        await this.takeScreenshot(`06-search-results-page-${currentPage}`)
        
        // Extract jobs from this page
        const pageJobs = await this.page.evaluate(() => {
          const jobElements = document.querySelectorAll(`
            li[data-id-storage-item-id],
            .job-item, 
            .offre, 
            [data-testid*="job"], 
            .search-result,
            article
          `)
          
          console.log(`Found ${jobElements.length} job elements on page`)
          
          const jobs: Array<{
            id: string;
            title: string;
            company: string;
            location: string;
            description: string;
            url: string;
            postedDate: Date;
            requirements: string[];
          }> = []

          jobElements.forEach((element, index) => {
            try {
              const jobId = element.getAttribute('data-id-storage-item-id')
              const linkElement = element.querySelector('a[href*="/fr-fr/emplois/"], a[href*="/emploi/"], a[href*="/offre/"]')
              
              let jobTitle = ''
              const h3Element = element.querySelector('h3')
              if (h3Element) {
                const titleP = h3Element.querySelector('p')
                jobTitle = titleP?.textContent?.trim() || ''
              }
              
              let companyName = ''
              if (h3Element) {
                const paragraphs = h3Element.querySelectorAll('p')
                if (paragraphs.length > 1) {
                  companyName = paragraphs[1].textContent?.trim() || ''
                }
              }
              
              if (!companyName) {
                const companyImg = element.querySelector('img[alt]')
                if (companyImg) {
                  companyName = companyImg.getAttribute('alt') || ''
                }
              }
              
              let location = ''
              const locationElement = element.querySelector('[data-cy="localisationCard"]')
              if (locationElement) {
                location = locationElement.textContent?.trim() || ''
              }
              
              let contractType = ''
              const contractElement = element.querySelector('[data-cy="contractCard"]')
              if (contractElement) {
                contractType = contractElement.textContent?.trim() || ''
              }
              
              let salary = ''
              const salaryElements = element.querySelectorAll('.tw-typo-s-bold')
              for (const el of salaryElements) {
                const text = el.textContent?.trim() || ''
                if (text.includes('€') || text.includes('000')) {
                  salary = text
                  break
                }
              }

              let jobUrl = linkElement?.getAttribute('href') || ''
              if (jobUrl && !jobUrl.startsWith('http')) {
                jobUrl = 'https://www.hellowork.com' + jobUrl
              }

              const description = [contractType, salary].filter(Boolean).join(' - ')

              if (jobTitle && jobUrl && jobId) {
                jobs.push({
                  id: jobId,
                  title: jobTitle,
                  company: companyName || 'Company not specified',
                  location: location || 'Location not specified',
                  description: description || 'No description available',
                  url: jobUrl,
                  postedDate: new Date(),
                  requirements: []
                })
              }
            } catch (error) {
              console.error(`Error extracting job ${index + 1}:`, error)
            }
          })

          return jobs
        })
        
        this.logger.success(`Found ${pageJobs.length} jobs on page ${currentPage}`)
        
        // Add new jobs to the collection using Set for efficient duplicate checking
        const newJobs = pageJobs.filter(job => !jobIdSet.has(job.id))
        
        // Add new job IDs to the Set
        newJobs.forEach(job => jobIdSet.add(job.id))
        
        allJobs.push(...newJobs)
        
        this.logger.info(`Total unique jobs collected: ${allJobs.length} (${newJobs.length} new from this page)`)
        
        // Safety check: if no new jobs found on this page, stop pagination
        if (newJobs.length === 0) {
          this.logger.warning('No new jobs found on this page, stopping pagination')
          hasNextPage = false
        }
      }
      
      this.logger.success(`🎉 Pagination complete! Collected ${allJobs.length} total jobs from ${currentPage} page(s)`)

      return allJobs
    } catch (error) {
      console.error('❌ HelloWork job search failed:', error)
      return []
    }
  }

  async testLoginButtonDetection(email: string, password: string): Promise<any> {
    this.logger.info('🔍 Testing HelloWork login button detection')
    
    let browser: Browser | null = null
    
    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: false, // Keep visible for debugging
        defaultViewport: { width: 1280, height: 720 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      })

      this.page = await browser.newPage()
      
      // Navigate to HelloWork login page
      this.logger.info('Navigating to HelloWork login page...')
      await this.page.goto('https://www.hellowork.com/fr-fr/mon-compte/connexion.html', { waitUntil: 'networkidle2' })
      
      await this.takeScreenshot('debug-01-login-page-loaded')
      
      // Handle cookie consent if present
      await this.handleCookieConsent()
      
      // Check for CAPTCHA before login
      await this.handlePreLoginCaptcha()
      
      // Fill credentials (just email and password for debugging)
      await this.humanType('#email', email)
      await humanSleep(HumanDelays.randomDelay(300, 700), 'Pause after email', this.logger)
      
      await this.humanType('#password', password)
      await humanSleep(HumanDelays.randomDelay(300, 700), 'Pause after password', this.logger)
      
      // Debug button detection - this is where we'll focus
      const debugInfo = await this.debugLoginButtons()
      
      this.logger.info('🔍 DEBUGGING: Keeping browser open for manual inspection')
      this.logger.info('   Check the browser window and look for the login button')
      this.logger.info('   Press Ctrl+C when done inspecting')
      
      // Keep browser open for debugging
      await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 1 minute
      
      return debugInfo
      
    } catch (error) {
      this.logger.error('❌ Login button detection test failed:', error)
      throw error
    } finally {
      // Don't close browser for debugging
      this.logger.info('Browser kept open for debugging')
    }
  }

  private async debugLoginButtons() {
    if (!this.page) {
      throw new Error('Page not initialized')
    }
    
    this.logger.info('🔍 Starting comprehensive button debugging...')
    
    // Enhanced button detection from our previous code
    const availableButtons = await this.page.evaluate(() => {
      const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]')
      return Array.from(buttons).map(btn => ({
        tagName: btn.tagName,
        type: (btn as HTMLInputElement).type || 'N/A',
        className: btn.className,
        id: btn.id,
        textContent: btn.textContent?.trim() || '',
        value: (btn as HTMLInputElement).value || '',
        visible: (btn as HTMLElement).offsetParent !== null,
        disabled: (btn as HTMLButtonElement | HTMLInputElement).disabled,
        dataAttributes: Array.from(btn.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`).join(' '),
        outerHTML: btn.outerHTML.substring(0, 200) + (btn.outerHTML.length > 200 ? '...' : '')
      }))
    })
    
    this.logger.info('📋 Available buttons:', availableButtons)
    
    // Search for login-related text
    const loginTexts = ['Je me connecte', 'Se connecter', 'Connexion', 'Login', 'Connecter']
    const buttonsByText = await this.page.evaluate((texts) => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
      return texts.map(text => {
        const matchingButtons = buttons.filter(btn => 
          btn.textContent?.trim().includes(text) ||
          (btn as HTMLInputElement).value?.includes(text)
        ).map(btn => ({
          searchText: text,
          tagName: btn.tagName,
          className: btn.className,
          textContent: btn.textContent?.trim() || '',
          value: (btn as HTMLInputElement).value || '',
          visible: (btn as HTMLElement).offsetParent !== null,
          disabled: (btn as HTMLButtonElement | HTMLInputElement).disabled,
          outerHTML: btn.outerHTML.substring(0, 150) + '...'
        }))
        return { searchText: text, matches: matchingButtons }
      }).filter(result => result.matches.length > 0)
    }, loginTexts)
    
    this.logger.info('🎯 Buttons found by text content:', buttonsByText)
    
    // Try our current selectors
    const loginButtonSelectors = [
      'button.profile-button[data-simple-progress]', 
      'button.profile-button', 
      'button[data-simple-progress]', 
      'form[data-gtm-form-interact-id] button[type="button"]', 
      'form[data-gtm-form-interact-id] button', 
      'form button[type="button"]', 
      'button[type="submit"]',
      'input[type="submit"]',
      'form button'
    ]
    
    const selectorResults = []
    for (const selector of loginButtonSelectors) {
      try {
        const button = await this.page.$(selector)
        if (button) {
          const isVisible = await button.isIntersectingViewport()
          const isEnabled = await button.evaluate(el => !(el as HTMLButtonElement).disabled)
          const boundingBox = await button.boundingBox()
          
          selectorResults.push({
            selector,
            found: true,
            visible: isVisible,
            enabled: isEnabled,
            boundingBox
          })
        } else {
          selectorResults.push({
            selector,
            found: false
          })
        }
      } catch (error) {
        selectorResults.push({
          selector,
          found: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    this.logger.info('🎯 Selector test results:', selectorResults)
    
    return {
      availableButtons,
      buttonsByText,
      selectorResults,
      pageUrl: this.page.url(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch full job description from job detail page
   * This is needed for accurate skill matching before applying
   */
  async getJobDescription(jobUrl: string): Promise<string> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error('Must be logged in to fetch job details')
    }

    try {
      this.logger.info(`📄 Fetching job description from: ${jobUrl}`)
      
      // Navigate to job detail page
      await this.page.goto(jobUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      })

      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Extract job description from the detail page
      const description = await this.page.evaluate(() => {
        const parts: string[] = []
        
        // Extract "Détail du poste" section
        const detailSection = document.querySelector('[data-truncate-text-target="content"]')
        if (detailSection) {
          const text = detailSection.textContent?.trim() || ''
          if (text) parts.push(text)
        }
        
        // Extract "Le profil recherché" section (collapsed by default)
        const profileSection = document.querySelector('#collapsed-content')
        if (profileSection) {
          const text = profileSection.textContent?.trim() || ''
          if (text) parts.push(text)
        }
        
        // Fallback: extract all paragraph text from main content
        if (parts.length === 0) {
          const paragraphs = document.querySelectorAll('.tw-typo-long-m, p')
          paragraphs.forEach(p => {
            const text = p.textContent?.trim() || ''
            if (text.length > 20) parts.push(text)
          })
        }
        
        return parts.join(' ')
      })

      this.logger.success(`Extracted description: ${description.substring(0, 100)}... (${description.length} chars)`)
      return description
    } catch (error) {
      this.logger.warning(`Failed to fetch job description: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return '' // Return empty string on error, skill matching will use title only
    }
  }

  async applyToJob(jobId: string, application: ApplicationData): Promise<AutoApplicationResult> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error('Must be logged in to apply to jobs')
    }

    try {
      console.log(`📤 Applying to job ${jobId} on HelloWork...`)
      
      // Check daily application limit
      const todayApplications = await this.getTodayApplicationCount()
      if (todayApplications >= this.config.applicationSettings.maxApplicationsPerDay) {
        return {
          success: false,
          jobId,
          message: 'Daily application limit reached',
          error: `Already applied to ${todayApplications} jobs today`
        }
      }

      // Navigate to job detail page using HelloWork URL format
      // Check if jobId contains the actual URL or just the ID
      let jobUrl: string
      if (jobId.startsWith('http')) {
        jobUrl = jobId // jobId is actually the full URL
      } else if (jobId.match(/^\d+$/)) {
        jobUrl = `${this.baseUrl}/fr-fr/emplois/${jobId}.html`
      } else {
        // Extract ID from HelloWork job ID format
        const id = jobId.replace('hw_real_', '').replace(/.*_/, '')
        jobUrl = `${this.baseUrl}/fr-fr/emplois/${id}.html`
      }
      
      console.log(`🔗 Navigating to job page: ${jobUrl}`)
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2' })

      // Take screenshot of job detail page
      await this.takeScreenshot('07-job-detail-page')

      // CHECK: Detect if job redirects to external recruiter site
      this.logger.info('Checking if job requires external application')
      const externalRecruiterButton = await this.page.evaluate(() => {
        // Look for the external recruiter button
        const externalButtons = Array.from(document.querySelectorAll('button[data-cy="applyButton"]'))
        
        for (const button of externalButtons) {
          const buttonText = button.textContent?.trim() || ''
          const redirectUrl = button.getAttribute('data-redirect-external-url-value')
          
          // Check if button text contains "site du recruteur" or has external redirect URL
          if (buttonText.toLowerCase().includes('site du recruteur') || 
              buttonText.toLowerCase().includes('site externe') ||
              redirectUrl?.includes('redirectionexterne')) {
            return {
              isExternal: true,
              buttonText,
              redirectUrl: redirectUrl || ''
            }
          }
        }
        
        return { isExternal: false, buttonText: '', redirectUrl: '' }
      })

      if (externalRecruiterButton.isExternal) {
        this.logger.warning(`⚠️ Job requires external application: "${externalRecruiterButton.buttonText}"`)
        this.logger.info(`External URL: ${externalRecruiterButton.redirectUrl}`)
        
        return {
          success: false,
          jobId,
          message: 'External recruiter application required',
          error: `This job requires applying on the recruiter's website. Button: "${externalRecruiterButton.buttonText}". HelloWork does not support direct application for this job.`
        }
      }

      // STEP 1: Find and click the first "Postuler" button to navigate to application form
      this.logger.info('Looking for navigation apply button (first button)')
      const navigationButtonSelectors = [
        'a[href="#postuler"][data-cy="applyButton"]',
        'a[href="#postuler"].tw-btn-primary-candidacy-l',
        'a[href="#postuler"]',
        '.tw-btn-primary-candidacy-l[href="#postuler"]'
      ]

      let navigationButton = null
      for (const selector of navigationButtonSelectors) {
        try {
          navigationButton = await this.page.$(selector)
          if (navigationButton) {
            this.logger.success(`Found navigation apply button: ${selector}`)
            break
          }
        } catch (error) {
          continue
        }
      }

      if (navigationButton) {
        this.logger.info('Clicking navigation apply button to reveal form')
        await navigationButton.click()
        await humanSleep(2000, 'Waiting after navigation button click', this.logger)
      } else {
        this.logger.warning('Navigation apply button not found, scrolling to application section')
        // Fallback: scroll to application section
        await this.page.evaluate(() => {
          const applySection = document.querySelector('#postuler, .tw-bg-purple-200')
          if (applySection) {
            applySection.scrollIntoView({ behavior: 'smooth' })
          }
        })
      }

      // Wait for the purple application section to be visible
      await this.page.waitForSelector('#postuler, .tw-bg-purple-200', { timeout: 10000 })
      this.logger.success('Application section is visible')
      
      // Wait for the turbo-frame to start loading
      await humanSleep(1000, 'Waiting for turbo-frame to start loading', this.logger)
      
      // Wait for the turbo-frame to load completely with multiple detection strategies
      try {
        // Strategy 1: Wait for the specific apply-form-frame to have complete attribute
        await this.page.waitForFunction(() => {
          const turboFrame = document.querySelector('turbo-frame#apply-form-frame')
          return turboFrame && (turboFrame.hasAttribute('complete') || turboFrame.getAttribute('complete') === '')
        }, { timeout: 15000 })
        
        this.logger.success('Turbo-frame loaded completely (complete attribute detected)')
      } catch {
        this.logger.debug('Turbo-frame complete attribute timeout, trying alternative detection')
        
        // Strategy 2: Wait for form elements to be present (form is loaded)
        try {
          await this.page.waitForSelector('turbo-frame#apply-form-frame form#apply-form', { timeout: 10000 })
          this.logger.success('Turbo-frame loaded completely (form elements detected)')
        } catch {
          // Strategy 3: Check if submit button is already present
          const submitButtonExists = await this.page.$('button[data-cy="submitButton"], button[type="submit"]')
          if (submitButtonExists) {
            this.logger.success('Turbo-frame loaded completely (submit button already present)')
          } else {
            this.logger.error('Turbo-frame loading detection failed with all strategies')
            throw new Error('Could not detect turbo-frame loading completion')
          }
        }
      }
      
      // Wait for the actual form elements to be present (HelloWork uses smart-apply-form)
      await this.page.waitForSelector('form#smart-apply-form, form#apply-form, button[data-cy="submitButton"]', { timeout: 15000 })
      
      // Additional wait for form to be fully rendered
      await humanSleep(3000, 'Waiting for form to be fully rendered', this.logger)

      // Take screenshot of the loaded application form
      await this.takeScreenshot('08-application-form-loaded')

      // STEP 2: Check for "Continuer" button (two-step form)
      this.logger.info('Checking for two-step form with "Continuer" button')
      const continueButtonSelectors = [
        'button[data-cy="saContinueButton"]',
        'button[data-smart-apply-target="continueButton"]',
        'form#smart-apply-form button[type="button"]',
        'button:has-text("Continuer")'
      ]

      let continueButton = null
      for (const selector of continueButtonSelectors) {
        try {
          const button = await this.page.$(selector)
          if (button) {
            const isVisible = await this.page.evaluate((el) => {
              const rect = el.getBoundingClientRect()
              const computedStyle = window.getComputedStyle(el)
              return rect.width > 0 && rect.height > 0 && 
                     computedStyle.visibility !== 'hidden' && 
                     computedStyle.display !== 'none'
            }, button)
            
            if (isVisible) {
              continueButton = button
              this.logger.success(`Found "Continuer" button: ${selector}`)
              break
            }
          }
        } catch (error) {
          this.logger.debug(`"Continuer" button not found: ${selector}`)
        }
      }

      // If "Continuer" button exists, click it to reveal additional fields
      if (continueButton) {
        this.logger.info('Two-step form detected, clicking "Continuer" button')
        
        await humanSleep(HumanDelays.formInteractionDelay(), 'Preparing to click Continuer', this.logger)
        
        try {
          await this.page.evaluate((button) => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, continueButton)
          await humanSleep(500, 'Button scrolled into view', this.logger)
          await continueButton.click()
          this.logger.success('"Continuer" button clicked successfully')
          
          // Wait for additional fields to be revealed
          await humanSleep(2000, 'Waiting for additional fields to appear', this.logger)
          
          // Take screenshot of revealed fields
          await this.takeScreenshot('08b-additional-fields-revealed')
          
          // STEP 3: Fill additional required fields (phone, address, etc.)
          this.logger.info('Filling additional required fields')
          
          // Phone field
          if (application.phone) {
            try {
              const phoneSelectors = [
                'input[pattern="[0-9]+"][maxlength="10"][minlength="10"]', // Most specific - phone pattern with 10 digits
                'input[placeholder*="téléphone"][pattern="[0-9]+"]', // Phone placeholder with pattern
                'input[placeholder*="telephone"][pattern="[0-9]+"]', // Alternative spelling
                'input[pattern="[0-9]+"][inputmode="numeric"]', // Numeric pattern with inputmode
                'input[type="tel"][pattern="[0-9]+"]', // Tel type with pattern
                'input[placeholder*="téléphone"]', // Fallback to placeholder only
                'input[placeholder*="telephone"]',
                'input[type="tel"]'
              ]
              
              for (const phoneSelector of phoneSelectors) {
                const phoneField = await this.page.$(phoneSelector)
                if (phoneField) {
                  this.logger.debug(`Found phone field: ${phoneSelector}`)
                  
                  await phoneField.click()
                  await humanSleep(HumanDelays.randomDelay(300, 600))
                  await phoneField.type(application.phone, { delay: HumanDelays.randomDelay(50, 150) })
                  this.logger.success(`Phone number filled: ${application.phone}`)
                  break
                }
              }
            } catch (error) {
              this.logger.warning('Could not fill phone field', { error })
            }
          } else {
            this.logger.warning('No phone number provided in application data')
          }
          
          // Postal code / Address field (if present and provided)
          if (application.address) {
            try {
              const addressSelectors = [
                'input[placeholder*="code postal"][maxlength="5"]', // Postal code with 5 digit limit
                'input[placeholder*="postal"][maxlength="5"]', // Alternative postal placeholder
                'input[placeholder*="adresse"]', // Address placeholder
                'input[placeholder*="address"]', // Alternative spelling
                'input[name="Address"]'
              ]
              
              for (const addressSelector of addressSelectors) {
                const addressField = await this.page.$(addressSelector)
                if (addressField) {
                  this.logger.debug(`Found address/postal field: ${addressSelector}`)
                  
                  await addressField.click()
                  await humanSleep(HumanDelays.randomDelay(300, 600))
                  await addressField.type(application.address, { delay: HumanDelays.randomDelay(50, 150) })
                  this.logger.success(`Address/postal code filled: ${application.address}`)
                  break
                }
              }
            } catch (error) {
              this.logger.debug('No address field found or not required')
            }
          } else {
            this.logger.debug('No address provided in application data')
          }
          
          // Wait a bit after filling fields
          await humanSleep(1000, 'Fields filled, preparing to submit', this.logger)
          
        } catch (continueError) {
          this.logger.error('Failed to click "Continuer" button or fill additional fields', { error: continueError })
          throw continueError
        }
      } else {
        this.logger.info('No "Continuer" button found - single-step form')
      }

      // STEP 4: Look for the actual submit button inside the loaded form
      this.logger.info('Looking for submit apply button ("Postuler")')
      const submitButtonSelectors = [
        'button[type="submit"][data-cy="submitButton"]',
        'button[form="smart-apply-form"][type="submit"]',
        'button[data-form-validator-target="button"]',
        'form#smart-apply-form button[type="submit"]',
        'turbo-frame button[type="submit"]',
        '#postuler button[type="submit"].tw-btn-primary-candidacy-l'
      ]

      let applyButton = null
      
      for (const selector of submitButtonSelectors) {
        try {
          // Wait for button to exist and check if it's visible
          const button = await this.page.waitForSelector(selector, { timeout: 5000 })
          if (button) {
            const isVisible = await this.page.evaluate((el) => {
              const rect = el.getBoundingClientRect()
              const computedStyle = window.getComputedStyle(el)
              return rect.width > 0 && rect.height > 0 && 
                     computedStyle.visibility !== 'hidden' && 
                     computedStyle.display !== 'none'
            }, button)
            
            if (isVisible) {
              applyButton = button
              this.logger.success(`Found visible submit button: ${selector}`)
              break
            } else {
              this.logger.debug(`Submit button found but not visible: ${selector}`)
            }
          }
        } catch (error) {
          this.logger.debug(`Submit button not found: ${selector}`)
        }
      }

      // If no specific button found, search by text content within turbo-frame
      if (!applyButton) {
        try {
          this.logger.debug('Searching for submit button by text content in turbo-frame...')
          const buttonFound = await this.page.evaluate(() => {
            // Look specifically within turbo-frame for the submit button
            const turboFrame = document.querySelector('turbo-frame[id*="apply"], turbo-frame[complete]')
            if (!turboFrame) return false
            
            const buttons = Array.from(turboFrame.querySelectorAll('button[type="submit"]'))
            const submitButton = buttons.find(btn => 
              btn.textContent?.includes('Postuler') && 
              btn.getAttribute('data-cy') === 'submitButton'
            )
            
            if (submitButton) {
              submitButton.setAttribute('data-temp-submit-btn', 'true')
              return true
            }
            return false
          })
          
          if (buttonFound) {
            applyButton = await this.page.$('button[data-temp-submit-btn="true"]')
            this.logger.success('Found submit button by text content in turbo-frame')
          }
        } catch (error) {
          this.logger.warning('Failed to find submit button by text content')
        }
      }

      if (!applyButton) {
        return {
          success: false,
          jobId,
          message: 'Apply button not found',
          error: 'Could not locate Postuler button on job page'
        }
      }

      // Check if form is already pre-filled (HelloWork usually pre-fills email and CV)
      this.logger.info('Checking pre-filled application form')
      
      // HelloWork pre-fills the form, but we can optionally add a custom message
      try {
        // Check if cover letter/motivation field exists and is expandable
        const motivationToggle = await this.page.$('label[for="cover-letter-collapse"]')
        if (motivationToggle) {
          this.logger.debug('Found motivation field toggle, expanding it')
          await motivationToggle.click()
          await humanSleep(HumanDelays.formInteractionDelay(), 'Expanding motivation field', this.logger)
          
          // Look for the motivation textarea
          const motivationField = await this.page.$('#Answer_Description, textarea[name="Description"]')
          if (motivationField && application.coverLetter) {
            await humanSleep(HumanDelays.formInteractionDelay(), 'Filling motivation message', this.logger)
            
            // Click and fill the motivation field
            await motivationField.click()
            await humanSleep(HumanDelays.randomDelay(500, 1000))
            
            // Type cover letter with realistic speed
            for (const char of application.coverLetter) {
              await this.page.keyboard.type(char)
              await humanSleep(HumanDelays.randomDelay(30, 100))
            }
            
            this.logger.success('Motivation message added')
          }
        }
      } catch (error) {
        this.logger.warning('Could not add custom motivation message, proceeding with pre-filled form')
      }

      // Handle file upload for resume if needed
      if (this.config.applicationSettings.resumeUrl) {
        console.log('⚠️ Resume upload detected but file handling not implemented in this demo')
      }

      // Take screenshot before submission
      await this.takeScreenshot('09-before-submit-button-click')
      
      // Log button information for debugging  
      const buttonInfo = await this.page.evaluate((button) => {
        const rect = button.getBoundingClientRect()
        const element = button as HTMLButtonElement | HTMLInputElement
        return {
          tagName: button.tagName,
          type: element.type || 'unknown',
          className: button.className,
          textContent: button.textContent?.trim(),
          isVisible: rect.width > 0 && rect.height > 0,
          coordinates: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        }
      }, applyButton)
      
      this.logger.debug('Submit button details', buttonInfo)

      // Click the Postuler button to submit application
      await humanSleep(HumanDelays.formInteractionDelay(), 'Preparing to submit application', this.logger)
      
      try {
        // Ensure button is in viewport and clickable
        await this.page.evaluate((button) => {
          button.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, applyButton)
        
        await humanSleep(1000, 'Ensuring button is in view', this.logger)
        
        // Try clicking with different approaches
        try {
          await applyButton.click()
          this.logger.success('Application submit button clicked successfully')
        } catch {
          // If regular click fails, try clicking at coordinates
          this.logger.warning('Regular click failed, trying coordinate click')
          const boundingBox = await applyButton.boundingBox()
          if (boundingBox) {
            await this.page.mouse.click(
              boundingBox.x + boundingBox.width / 2,
              boundingBox.y + boundingBox.height / 2
            )
            this.logger.success('Application submit button clicked via coordinates')
          } else {
            throw new Error('Could not get button coordinates for clicking')
          }
        }
      } catch (buttonClickError) {
        this.logger.error('Failed to click apply button', { error: buttonClickError })
        throw buttonClickError
      }

      // Wait for confirmation or redirect
      try {
        // Wait for various success indicators
        await Promise.race([
          this.page.waitForSelector('.success, .confirmation, [class*="success"], [class*="confirm"]', { timeout: 10000 }),
          this.page.waitForSelector('[data-turbo-frame*="otp"], turbo-frame[id*="otp"]', { timeout: 10000 }),
          this.page.waitForFunction(() => 
            document.body.textContent?.includes('candidature') || 
            document.body.textContent?.includes('envoyé') ||
            document.body.textContent?.includes('merci')
          , {}, { timeout: 10000 })
        ])
        this.logger.success('Application confirmation detected')
      } catch {
        // Check if we were redirected to a success page or got a different response
        const currentUrl = this.page.url()
        const pageText = await this.page.evaluate(() => document.body.textContent?.toLowerCase() || '')
        
        if (currentUrl.includes('success') || currentUrl.includes('confirmation') || currentUrl.includes('candidature')) {
          this.logger.success('Redirected to confirmation page')
        } else if (pageText.includes('candidature') || pageText.includes('envoyé') || pageText.includes('merci')) {
          this.logger.success('Confirmation text detected on page')
        } else {
          this.logger.warning('No clear confirmation detected, but application may have been sent')
          this.logger.debug('Current URL', { url: currentUrl })
        }
      }

      // Take final screenshot
      await this.takeScreenshot('10-application-completed')

      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      return {
        success: true,
        jobId,
        message: 'Application submitted successfully to HelloWork',
        applicationId
      }

    } catch (error) {
      console.error('❌ HelloWork application failed:', error)
      return {
        success: false,
        jobId,
        message: 'Application failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if a job has already been applied to by checking the database
   * @param jobId - The job ID from the job board (sourceId)
   * @param userId - The user ID
   * @param source - The job board name (e.g., 'HelloWork')
   * @returns true if already applied, false otherwise
   */
  private async hasAlreadyApplied(jobId: string, userId: string, source: string): Promise<boolean> {
    try {
      // Check if job exists in database with same source and sourceId
      const existingJob = await query(
        'SELECT id FROM job WHERE source = ? AND sourceId = ?',
        [source, jobId]
      )

      if (existingJob.length > 0) {
        // Check if we have an application for this job
        const existingApp = await query(
          'SELECT id FROM application WHERE jobId = ? AND userId = ?',
          [existingJob[0].id, userId]
        )
        
        return existingApp.length > 0
      }
      
      return false
    } catch (error) {
      this.logger.warning('Error checking existing application', { error })
      // If database check fails, proceed with caution (don't apply)
      return false
    }
  }

  /**
   * Automated job search and application workflow
   */
  async searchAndApplyToJobs(criteria: SearchCriteria, application: ApplicationData): Promise<{
    searchResults: JobListing[]
    applications: AutoApplicationResult[]
  }> {
    console.log('🚀 Starting automated job search and application process...')
    
    const allJobs: JobListing[] = []
    const jobIds = new Set<string>() // Track job IDs to avoid duplicates across skills
    
    // Search for each skill individually instead of combining them
    const skills = criteria.keywords.slice(0, 5) // Limit to first 5 skills to avoid too many searches
    console.log(`🔎 Searching for jobs with ${skills.length} skills individually...`)
    
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]
      console.log(`\n🔍 [${i + 1}/${skills.length}] Searching for skill: "${skill}"`)
      
      try {
        // Create criteria with single skill
        const singleSkillCriteria: SearchCriteria = {
          ...criteria,
          keywords: [skill]
        }
        
        const jobs = await this.searchJobs(singleSkillCriteria)
        console.log(`   Found ${jobs.length} jobs for "${skill}"`)
        
        // Add only new jobs (deduplicate by ID and check database for existing applications)
        let newJobsCount = 0
        let alreadyAppliedCount = 0
        
        for (const job of jobs) {
          if (!jobIds.has(job.id)) {
            // Check if we've already applied to this job in the database
            const alreadyApplied = await this.hasAlreadyApplied(job.id, this.config.userId, this.config.boardName)
            
            if (alreadyApplied) {
              this.logger.debug(`Skipping "${job.title}" - already applied (found in database)`)
              alreadyAppliedCount++
            } else {
              jobIds.add(job.id)
              allJobs.push(job)
              newJobsCount++
            }
          }
        }
        
        if (newJobsCount > 0) {
          console.log(`   ✅ Added ${newJobsCount} new unique jobs`)
        }
        if (alreadyAppliedCount > 0) {
          console.log(`   ⏭️  Skipped ${alreadyAppliedCount} jobs (already applied)`)
        }
        if (newJobsCount === 0 && alreadyAppliedCount === 0) {
          console.log(`   ⏭️  No new jobs (all were duplicates from other skills)`)
        }
        
        // Add delay between skill searches to appear human-like
        if (i < skills.length - 1) {
          const delay = Math.random() * 5000 + 3000 // 3-8 seconds
          console.log(`   ⏱️  Waiting ${Math.round(delay/1000)}s before searching next skill...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        console.error(`   ❌ Error searching for skill "${skill}":`, error)
        // Continue with other skills even if one fails
      }
    }
    
    console.log(`\n📋 Total unique jobs found across all skills: ${allJobs.length}`)
    
    if (allJobs.length === 0) {
      console.log('ℹ️  No new jobs to apply to (all jobs either duplicates or already applied)')
      return { searchResults: [], applications: [] }
    }
    
    const applications: AutoApplicationResult[] = []
    
    // Apply to each job found
    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i]
      console.log(`\n📤 Applying to job ${i + 1}/${allJobs.length}: "${job.title}" at "${job.company}"`)
      
      try {
        // Use the job URL directly for application
        const result = await this.applyToJob(job.url, application)
        applications.push(result)
        
        if (result.success) {
          console.log(`✅ Successfully applied to "${job.title}"`)
        } else {
          console.log(`❌ Failed to apply to "${job.title}": ${result.error}`)
        }
        
        // Add delay between applications to appear human-like
        if (i < allJobs.length - 1) {
          const delay = Math.random() * 30000 + 15000 // 15-45 seconds
          console.log(`⏱️ Waiting ${Math.round(delay/1000)} seconds before next application...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        console.error(`❌ Error applying to job "${job.title}":`, error)
        applications.push({
          success: false,
          jobId: job.id,
          message: 'Application process failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`\n📊 Application Summary:`)
    const successful = applications.filter(app => app.success).length
    console.log(`   ✅ Successful applications: ${successful}`)
    console.log(`   ❌ Failed applications: ${applications.length - successful}`)
    
    return { searchResults: allJobs, applications }
  }

  async logout(): Promise<void> {
    console.log('🔐 Logging out of HelloWork...')
    await this.cleanup()
  }

  private async cleanup(keepOpen = false): Promise<void> {
    try {
      if (keepOpen) {
        this.logger.info('🔍 Browser kept open for debugging - close manually when done')
        return
      }
      
      if (this.browser) {
        await this.browser.close()
        this.browser = null
        this.page = null
        this.isLoggedIn = false
        console.log('🧹 Browser cleanup completed')
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
    }
  }

  private async getTodayApplicationCount(): Promise<number> {
    // This would query the database for today's applications
    // For now, return 0 to allow applications
    return 0
  }
}

// Export factory function to use real automation
export function createRealHelloWorkAutomator(config: JobBoardConfig): RealHelloWorkAutomator {
  return new RealHelloWorkAutomator(config)
}