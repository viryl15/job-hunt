# HelloWork Real Automation Guide

## 🚀 How to Test Real Job Applications

### Phase 1: Demo Mode Testing (SAFE)
1. **Keep "DEMO MODE" enabled** (green checkbox in UI)
2. Click "Run Automation" - this will simulate applications without touching real jobs
3. Verify the flow works and your credentials are accepted
4. Check the console logs for "Connection test successful"

### Phase 2: Real Mode Preparation (BEFORE enabling)
1. **Complete your HelloWork profile:**
   - Upload your latest CV/resume
   - Fill out all profile sections
   - Set your job preferences
   
2. **Review your cover letter template:**
   - Make sure placeholders like `{{COMPANY_NAME}}` make sense
   - Test with a few company names manually
   - Ensure the tone and content are professional

3. **Set conservative limits:**
   - Start with max 1-2 applications per day
   - Choose very specific skills to limit matches
   - Test with a narrow location first

### Phase 3: Real Mode Testing (CAUTION!)
1. **Enable Real Automation Mode** (red checkbox)
2. **Start small:**
   - Use very specific job criteria (narrow down matches)
   - Set `maxApplicationsPerDay` to 1
   - Monitor the first application closely

3. **Monitor the process:**
   - Watch browser automation (if headless=false)
   - Check screenshots saved in project root
   - Verify applications in your HelloWork account

## 🛡️ Safety Features Built-In

### Daily Limits
- Hard limit on applications per day
- Database tracking of all attempts
- Automatic stopping when limit reached

### Error Handling
- Login failure detection
- Form validation errors caught
- Graceful fallbacks for UI changes

### Debug Features
- Screenshot capture at each step
- Detailed console logging
- Application status tracking

## 🔧 Configuration Options

### Environment Variables (.env.automation)
```bash
# Enable/disable real applications
ENABLE_REAL_AUTOMATION=false

# Browser behavior
PUPPETEER_HEADLESS=false  # Set to true for production
PUPPETEER_TIMEOUT=30000

# Safety limits
MAX_DAILY_APPLICATIONS=3
DELAY_BETWEEN_APPLICATIONS=5000

# Debug helpers
DEBUG_SCREENSHOTS=true
VERBOSE_LOGGING=true
```

### Application Settings (in UI)
- **Max Applications Per Day**: Start with 1-2, increase gradually
- **Cover Letter Template**: Use placeholders for personalization
- **Skills/Keywords**: Be specific to avoid irrelevant matches
- **Location Preference**: Test with one city first

## 📊 Verification Steps

### Before Each Run:
1. ✅ HelloWork profile is complete and up-to-date
2. ✅ CV/resume is uploaded and current
3. ✅ Cover letter template reviewed and tested
4. ✅ Job criteria are specific (not too broad)
5. ✅ Daily limits are conservative
6. ✅ You're prepared to monitor the process

### After Each Run:
1. ✅ Check HelloWork account for new applications
2. ✅ Review application logs in the system
3. ✅ Verify cover letters were personalized correctly
4. ✅ Confirm no errors in console/screenshots
5. ✅ Adjust criteria based on job quality

## 🚨 Emergency Stop

If something goes wrong:
1. **Close the browser** if you see it running
2. **Refresh the automation page** to stop pending requests
3. **Check your HelloWork account** for any unwanted applications
4. **Review the logs** to understand what happened
5. **Adjust settings** before trying again

## 📝 Best Practices

### Gradual Rollout:
1. **Week 1**: Demo mode only, perfect your setup
2. **Week 2**: Real mode with 1 application/day, specific criteria
3. **Week 3**: Increase to 2-3 applications/day if quality is good
4. **Week 4+**: Scale up gradually based on success rate

### Quality Control:
- Review first few applications manually on HelloWork
- Adjust cover letter template based on results
- Refine job criteria to improve match quality
- Monitor response rates and adjust strategy

### Legal & Ethical:
- Only use with your own HelloWork account
- Respect HelloWork's terms of service
- Don't overwhelm employers with mass applications
- Maintain personal touch in applications

## 🔍 Troubleshooting

### Common Issues:
1. **"Login failed"**: Check credentials, try manual login first
2. **"No jobs found"**: Broaden search criteria or check spelling
3. **"Apply button not found"**: HelloWork may have changed their UI
4. **"Form submission failed"**: Manual profile completion needed

### Debug Steps:
1. Check screenshots saved in project root
2. Review browser console for JavaScript errors
3. Try manual login to HelloWork to verify account
4. Test with broader job search criteria
5. Check if HelloWork has anti-bot measures active

## 💡 Tips for Success

1. **Keep it human**: Don't apply to every job, be selective
2. **Personalize smartly**: Use meaningful placeholders in templates
3. **Monitor regularly**: Check your HelloWork account often
4. **Adjust based on feedback**: Refine based on employer responses
5. **Stay compliant**: Follow HelloWork's terms and rate limits

Remember: The goal is to enhance your job search, not replace human judgment. Always review and improve your automation based on real results.