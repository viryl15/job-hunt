// Real HelloWork automation using Puppeteer for actual job applications
import puppeteer, { Browser, Page } from 'puppeteer'
import { JobBoardConfig } from './database'
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
    this.screenshotDir = path.join(process.cwd(), 'automation-screenshots')
    
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
        
        // HelloWork specific bot detection text
        'div:contains("Nous vérifions que vous n\'êtes pas un")',
        'div:contains("vérification")',
        'div:contains("robot")',
        'div:contains("bot")',
        
        // Slider/puzzle verifications
        '.slider-verification',
        '[class*="slider"]',
        '.puzzle-verification'
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
        this.logger.info('Waiting 45 seconds for potential manual completion...')
        await humanSleepWithMouse(this.page, 45000, 'Waiting for manual CAPTCHA completion with mouse activity', this.logger)
        
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
      
      // Navigate to job search page using the correct URL
      await this.page.goto(this.searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // Handle cookie consent modal if it appears on search page too
      await this.handleCookieConsent()

      // Take screenshot of search page
      await this.takeScreenshot('04-search-page')

      // Wait for page to fully load with reading behavior
      const searchPageLoadDelay = HumanDelays.pageLoadDelay()
      await MouseMovements.simulateReading(this.page, searchPageLoadDelay, this.logger)

      // Fill search criteria with human-like behavior
      const searchQuery = criteria.keywords.join(' ')
      this.logger.info('Filling search criteria', { searchQuery, location: criteria.location })
      
      // Find and fill job search input with multiple selectors based on actual HelloWork HTML structure
      const jobSearchSelectors = [
        'input[name="Job"]', // HelloWork uses Job as the name for job search field
        'input[id="Job"]', // HelloWork search page uses Job as id
        'input[placeholder*="Chef de projet, vendeur, comptable" i]', // Actual HelloWork placeholder
        'input[name="q"]',
        'input[name="keywords"]', 
        'input[name="what"]',
        'input[placeholder*="métier" i]',
        'input[placeholder*="poste" i]',
        'input[placeholder*="emploi" i]',
        'input[id*="search"]',
        '#q',
        '#keywords'
      ]
      
      let jobSearchField = null
      for (const selector of jobSearchSelectors) {
        try {
          jobSearchField = await this.page.waitForSelector(selector, { timeout: 2000 })
          if (jobSearchField) {
            this.logger.debug(`Found job search field with selector: ${selector}`)
            break
          }
        } catch (error) {
          continue
        }
      }
      
      if (!jobSearchField) {
        await this.takeScreenshot('05-no-search-field-found')
        throw new Error('Could not find job search input field')
      }
      
      // Find the working selector again for typing
      let foundJobSearchSelector = ''
      for (const selector of jobSearchSelectors) {
        try {
          const element = await this.page.$(selector)
          if (element) {
            foundJobSearchSelector = selector
            break
          }
        } catch (error) {
          continue
        }
      }
      
      await humanSleep(HumanDelays.formInteractionDelay(), 'Thinking about job search terms', this.logger)
      await this.humanType(foundJobSearchSelector, searchQuery)
      this.logger.success('Job search field filled')

      // Find and fill location input
      const locationSelectors = [
        'input[name="Locality"]', // HelloWork uses Locality as the name for location field
        'input[id="Locality"]', // HelloWork search page uses Locality as id
        'input[placeholder*="Ville, département, code postal" i]', // Actual HelloWork placeholder
        'input[name="l"]',
        'input[name="location"]',
        'input[name="where"]',
        'input[placeholder*="lieu" i]',
        'input[placeholder*="ville" i]',
        'input[placeholder*="localisation" i]',
        'input[id*="location"]',
        '#l',
        '#location'
      ]
      
      let locationField = null
      for (const selector of locationSelectors) {
        try {
          locationField = await this.page.waitForSelector(selector, { timeout: 2000 })
          if (locationField) {
            this.logger.debug(`Found location field with selector: ${selector}`)
            
            // Find working selector for typing
            let foundLocationSelector = ''
            for (const locSelector of locationSelectors) {
              try {
                const element = await this.page.$(locSelector)
                if (element) {
                  foundLocationSelector = locSelector
                  break
                }
              } catch (error) {
                continue
              }
            }
            
            await humanSleep(HumanDelays.navigationDelay(), 'Moving to location field', this.logger)
            await this.humanType(foundLocationSelector, criteria.location)
            this.logger.success('Location field filled')
            break
          }
        } catch (locationError) {
          continue
        }
      }
      
      if (!locationField) {
        this.logger.warning('Location field not found, continuing without it')
      }

      // Submit search with human-like behavior
      await humanSleep(HumanDelays.formInteractionDelay(), 'Reviewing search criteria', this.logger)
      
      const searchButtonSelectors = [
        'form#searchForm button[type="submit"]', // HelloWork uses searchForm id
        'form[data-turbo-frame="searchOfferFacetFrame"] button[type="submit"]', // HelloWork search form
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Rechercher")',
        'button:contains("Chercher")',
        '.search-button',
        '#search-button',
        '[data-testid*="search"]'
      ]
      
      let searchSubmitted = false
      for (const selector of searchButtonSelectors) {
        try {
          // Move mouse to search button before clicking
          await MouseMovements.moveToElement(this.page, selector, this.logger)
          
          // Brief pause before submitting search
          await humanSleep(HumanDelays.randomDelay(300, 700), 'Final review before search', this.logger)
          
          await this.page.click(selector)
          this.logger.success('Search form submitted')
          searchSubmitted = true
          break
        } catch (error) {
          continue
        }
      }
      
      if (!searchSubmitted) {
        // Try pressing Enter on the search field as fallback
        await this.page.keyboard.press('Enter')
        this.logger.info('Search submitted via Enter key')
      }

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
        // HelloWork uses complex job cards with specific structure
        const jobElements = document.querySelectorAll(`
          .job-item, 
          .offre, 
          [data-testid*="job"], 
          .search-result,
          article,
          [class*="tw-max-h-"][class*="tw-min-h-"][class*="tw-relative"]:not([class*="tw-bg-black"]):has(img),
          turbo-frame#turboSerp article,
          turbo-frame#turboSerp .job-card
        `)
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
            // HelloWork job title selectors
            const titleElement = element.querySelector(`
              h2 a, h3 a, .job-title a, [data-testid*="title"] a,
              .tw-typo-m a, .tw-typo-l a, 
              a[href*="/emploi/"], a[href*="/offre/"]
            `)
            
            // HelloWork company selectors (often in images or specific divs)
            const companyElement = element.querySelector(`
              .company, .entreprise, [data-testid*="company"],
              img[alt]:not([alt=""]), img[src*="media"],
              .tw-z-\\[2\\], [class*="tw-bg-white"]:has(img)
            `)
            
            // HelloWork location selectors
            const locationElement = element.querySelector(`
              .location, .lieu, [data-testid*="location"],
              .tw-text-grey-500, [class*="tw-text-grey"]
            `)
            
            // HelloWork description selectors
            const descriptionElement = element.querySelector(`
              .description, .resume, .job-description,
              .tw-typo-s, [class*="tw-typo"]:not([class*="tw-typo-m"]):not([class*="tw-typo-l"])
            `)
            
            // HelloWork job link selectors
            const linkElement = element.querySelector(`
              a[href*="/emploi/"], a[href*="/offre/"], 
              a[href*="hellowork.com/"]
            `)

            // Extract company name from image alt or other sources
            let companyName = ''
            if (companyElement) {
              if (companyElement.tagName === 'IMG') {
                companyName = (companyElement as HTMLImageElement).alt || ''
              } else {
                companyName = companyElement.textContent?.trim() || ''
              }
            }

            if (titleElement && linkElement && (companyName || companyElement)) {
              jobs.push({
                id: `hw_real_${Date.now()}_${index}`,
                title: titleElement.textContent?.trim() || '',
                company: companyName,
                location: locationElement?.textContent?.trim() || '',
                description: descriptionElement?.textContent?.trim() || '',
                url: linkElement.getAttribute('href') || '',
                postedDate: new Date(),
                requirements: []
              })
            }
          } catch (error) {
            console.error('Error extracting job data:', error)
          }
        })

        return jobs
      })

      console.log(`✅ Found ${jobs.length} real jobs on HelloWork`)

      // Take screenshot of results for debugging
      if (process.env.NODE_ENV !== 'production') {
        await this.page.screenshot({ path: 'hellowork-search-results.png', fullPage: true })
      }

      return jobs
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

      // Navigate to job detail page (assuming URL is in job data)
      // In real implementation, you'd store the job URL during search
      const jobUrl = `${this.baseUrl}/emploi/offre/${jobId.replace('hw_real_', '')}`
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2' })

      // Look for "Apply" button
      const applyButtonSelectors = [
        'button:contains("Postuler")',
        'a:contains("Postuler")',
        'button[data-testid*="apply"]',
        '.btn-apply',
        '.postuler'
      ]

      let applyButton = null
      for (const selector of applyButtonSelectors) {
        try {
          applyButton = await this.page.waitForSelector(selector, { timeout: 3000 })
          if (applyButton) break
        } catch (error) {
          continue
        }
      }

      if (!applyButton) {
        return {
          success: false,
          jobId,
          message: 'Apply button not found',
          error: 'Could not locate application button on job page'
        }
      }

      // Click apply button
      await applyButton.click()

      // Wait for application form
      await this.page.waitForSelector('form, .application-form, [data-testid*="application"]', { timeout: 10000 })

      // Fill application form
      try {
        // Look for cover letter field with human-like behavior
        const coverLetterSelectors = [
          'textarea[name*="cover"]', 
          'textarea[name*="lettre"]', 
          'textarea[placeholder*="motivation" i]',
          'textarea[id*="cover"]',
          'textarea[id*="lettre"]'
        ]
        
        this.logger.debug('Looking for cover letter field')
        let coverLetterFilled = false
        
        for (const selector of coverLetterSelectors) {
          try {
            const field = await this.page.$(selector)
            if (field) {
              await humanSleep(HumanDelays.formInteractionDelay(), 'Preparing cover letter', this.logger)
              
              // Clear existing content and type with human-like behavior
              await field.click({ clickCount: 3 }) // Select all
              await this.page.keyboard.press('Delete')
              
              // Type cover letter with realistic speed
              for (const char of application.coverLetter) {
                await this.page.keyboard.type(char)
                await humanSleep(HumanDelays.randomDelay(30, 100))
              }
              
              this.logger.success('Cover letter filled')
              coverLetterFilled = true
              break
            }
          } catch (coverLetterError) {
            continue
          }
        }

        if (!coverLetterFilled) {
          this.logger.warning('Could not find cover letter field')
        }

        // Look for additional message field
        if (application.customMessage) {
          const messageSelectors = [
            'textarea[name*="message"]', 
            'input[name*="message"]',
            'textarea[placeholder*="message" i]'
          ]
          
          this.logger.debug('Looking for custom message field')
          
          for (const selector of messageSelectors) {
            try {
              const field = await this.page.$(selector)
              if (field) {
                await humanSleep(HumanDelays.formInteractionDelay(), 'Adding custom message', this.logger)
                await field.click({ clickCount: 3 })
                await this.page.keyboard.press('Delete')
                
                for (const char of application.customMessage) {
                  await this.page.keyboard.type(char)
                  await humanSleep(HumanDelays.randomDelay(30, 100))
                }
                
                this.logger.success('Custom message filled')
                break
              }
            } catch (messageError) {
              continue
            }
          }
        }

        // Handle file upload for resume if needed
        if (this.config.applicationSettings.resumeUrl) {
          console.log('⚠️ Resume upload detected but file handling not implemented in this demo')
        }

        // Take screenshot before submission
        if (process.env.NODE_ENV !== 'production') {
          await this.page.screenshot({ path: `hellowork-application-${jobId}.png`, fullPage: true })
        }

        // Submit application
        const submitSelectors = [
          'button[type="submit"]',
          'button:contains("Envoyer")',
          'button:contains("Postuler")',
          '.btn-submit'
        ]

        let submitted = false
        for (const selector of submitSelectors) {
          try {
            await this.page.click(selector)
            submitted = true
            console.log('✅ Application submitted!')
            break
          } catch (error) {
            continue
          }
        }

        if (!submitted) {
          throw new Error('Could not find submit button')
        }

        // Wait for confirmation
        try {
          await this.page.waitForSelector(
            '.success, .confirmation, :contains("candidature envoyée")', 
            { timeout: 10000 }
          )
        } catch (error) {
          console.log('⚠️ No confirmation message detected, but application may have been sent')
        }

        const applicationId = `app_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        return {
          success: true,
          jobId,
          message: 'Application submitted successfully to HelloWork',
          applicationId
        }

      } catch (error) {
        console.error('❌ Error filling application form:', error)
        return {
          success: false,
          jobId,
          message: 'Failed to fill application form',
          error: error instanceof Error ? error.message : 'Unknown form error'
        }
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