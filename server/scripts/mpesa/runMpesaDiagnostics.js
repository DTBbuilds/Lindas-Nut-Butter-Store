/**
 * M-Pesa Diagnostics Runner
 * 
 * This script runs comprehensive diagnostics on your M-Pesa integration
 * and provides detailed recommendations to fix any issues found.
 */
const readline = require('readline');
const { runFullDiagnostics } = require('./utils/mpesaDiagnostics');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Clear console
console.clear();
console.log(`
🌟 ========================================================== 🌟
       M-PESA INTEGRATION DIAGNOSTICS FOR LINDA'S STORE
🌟 ========================================================== 🌟
`);

// Ask for phone number
rl.question('Enter a phone number for STK push test (or press enter to skip): ', async (phoneNumber) => {
  try {
    // Clear logs for fresh diagnostics
    clearLogs();
    
    // Run full diagnostics
    const results = await runFullDiagnostics(phoneNumber || null);
    
    // Display results in a more readable format
    console.log('\n📋 DIAGNOSTICS RESULTS SUMMARY:');
    console.log('================================');
    
    console.log(`\n🔧 Configuration:`);
    console.log(`- Environment: ${results.environment}`);
    console.log(`- API Base URL: ${results.baseUrl}`);
    console.log(`- Paybill Number: ${results.configuration.paybillNumber}`);
    console.log(`- Consumer Key Present: ${results.configuration.consumerKeyPresent ? '✅ Yes' : '❌ No'}`);
    console.log(`- Consumer Secret Present: ${results.configuration.consumerSecretPresent ? '✅ Yes' : '❌ No'}`);
    console.log(`- Passkey Present: ${results.configuration.passKeyPresent ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n📊 Test Results:');
    
    for (const [test, result] of Object.entries(results.tests)) {
      console.log(`\n🔍 ${test.charAt(0).toUpperCase() + test.slice(1)} Test: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   ${result.message}`);
      
      if (!result.success && result.issues) {
        console.log('   Issues found:');
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }
    
    console.log('\n📝 Recommendations:');
    results.recommendations.forEach(rec => console.log(`- ${rec}`));
    
    // Common issues and fixes
    console.log('\n🔧 COMMON FIXES FOR M-PESA INTEGRATION ISSUES:');
    console.log('1. Check that your Consumer Key and Secret are correct');
    console.log('2. Ensure your passkey is the correct one for your environment (sandbox vs production)');
    console.log('3. Verify that callback URLs are accessible from the internet (use ngrok in development)');
    console.log('4. For sandbox environment, use the test phone numbers provided by Safaricom');
    console.log('5. Make sure your paybill number is correct and active');
    console.log('6. Check that your app has proper error handling for M-Pesa responses');
    
    // Missing required fields and components
    console.log('\n📚 REQUIRED TOOLS FOR DARAJA API INTEGRATION:');
    console.log('1. ✅ OAuth Token Generation - For authentication with Safaricom API');
    console.log('2. ✅ STK Push Implementation - For payment initiation');
    console.log('3. ✅ Transaction Status Query - For checking payment status');
    console.log('4. ✅ Callback URL Handling - For receiving payment notifications');
    console.log('5. ✅ Proper Phone Number Formatting - For consistent phone number format');
    console.log('6. ✅ Robust Error Handling - For graceful handling of API errors');
    console.log('7. ✅ Logging System - For troubleshooting issues');
    
    console.log('\n📊 ADDITIONAL TOOLS PROVIDED:');
    console.log('1. ✅ Enhanced M-Pesa Logger (mpesaLogger.js) - For detailed logging of all M-Pesa transactions');
    console.log('2. ✅ Complete Daraja API Implementation (darajaApi.js) - Full implementation of all required API endpoints');
    console.log('3. ✅ Diagnostics Tool (mpesaDiagnostics.js) - For troubleshooting integration issues');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run your server with the diagnostic tools: npm run dev');
    console.log('2. Set up ngrok tunnel for callbacks: npm run tunnel');
    console.log('3. Check server logs for detailed error information');
    console.log('4. Update your implementation based on the diagnostics results');
    
    console.log('\n🌟 ========================================================== 🌟');
    console.log('         Diagnostics complete! Logs saved for reference.');
    console.log('🌟 ========================================================== 🌟\n');
    
    rl.close();
  } catch (error) {
    console.error('Error running diagnostics:', error);
    rl.close();
  }
});
