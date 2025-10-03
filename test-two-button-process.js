// Test to validate HelloWork two-button apply process
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the job detail HTML
const jobDetailHtml = fs.readFileSync('html/hw-job-detail.html', 'utf8');
const applyFormHtml = fs.readFileSync('html/hw-apply-form.html', 'utf8');

function testTwoButtonProcess() {
  console.log('🧪 Testing HelloWork two-button apply process...\n');

  // Test 1: Navigation button in job detail
  const jobDetailDom = new JSDOM(jobDetailHtml);
  const jobDetailDoc = jobDetailDom.window.document;
  
  const navButton = jobDetailDoc.querySelector('a[href="#postuler"][data-cy="applyButton"]');
  console.log('1️⃣ Navigation Button Test:');
  console.log(`   Found: ${!!navButton}`);
  if (navButton) {
    console.log(`   Text: "${navButton.textContent?.trim()}"`);
    console.log(`   Href: "${navButton.getAttribute('href')}"`);
    console.log(`   Classes: "${navButton.className}"`);
  }
  
  // Test 2: Submit button in apply form
  const applyFormDom = new JSDOM(applyFormHtml);
  const applyFormDoc = applyFormDom.window.document;
  
  const submitButton = applyFormDoc.querySelector('button[type="submit"][data-cy="submitButton"]');
  console.log('\n2️⃣ Submit Button Test:');
  console.log(`   Found: ${!!submitButton}`);
  if (submitButton) {
    console.log(`   Text: "${submitButton.textContent?.trim()}"`);
    console.log(`   Type: "${submitButton.getAttribute('type')}"`);
    console.log(`   Data-cy: "${submitButton.getAttribute('data-cy')}"`);
    console.log(`   Classes: "${submitButton.className}"`);
  }
  
  // Test 3: Turbo-frame detection
  const turboFrame = applyFormDoc.querySelector('turbo-frame[id*="apply-form-frame"]');
  console.log('\n3️⃣ Turbo-Frame Test:');
  console.log(`   Found: ${!!turboFrame}`);
  if (turboFrame) {
    console.log(`   ID: "${turboFrame.getAttribute('id')}"`);
    console.log(`   Has complete attr: ${turboFrame.hasAttribute('complete')}`);
    console.log(`   Loading: "${turboFrame.getAttribute('loading')}"`);
  }
  
  console.log('\n✅ Two-button process validation complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Navigation button (job detail): ${!!navButton ? '✅' : '❌'}`);
  console.log(`   - Submit button (apply form): ${!!submitButton ? '✅' : '❌'}`);
  console.log(`   - Turbo-frame structure: ${!!turboFrame ? '✅' : '❌'}`);
}

testTwoButtonProcess();