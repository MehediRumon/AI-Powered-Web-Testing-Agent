// Demo script to test the elementType functionality
// This creates test cases that demonstrate the problem and solution

const path = require('path');

function createDemoTestCases() {
    console.log('🎯 Creating demo test cases for elementType functionality...\n');
    
    const testPageUrl = 'file://' + path.resolve(__dirname, 'test-page.html');
    console.log('Test page URL:', testPageUrl);
    
    // Test Case 1: Click the navbar link specifically
    const navbarLoginTest = {
        name: "Click Navbar Login Link",
        description: "Test clicking the Login link in the navigation bar",
        url: testPageUrl,
        actions: [
            {
                type: "navigate",
                value: testPageUrl,
                description: "Navigate to test page"
            },
            {
                type: "click",
                selector: "text=Login",
                elementType: "link",
                description: "Click the Login link in navbar (should prefer <a> elements)"
            }
        ]
    };
    
    // Test Case 2: Click the form button specifically  
    const formLoginTest = {
        name: "Click Form Login Button",
        description: "Test clicking the Login button in the form",
        url: testPageUrl,
        actions: [
            {
                type: "navigate", 
                value: testPageUrl,
                description: "Navigate to test page"
            },
            {
                type: "click",
                selector: "text=Login",
                elementType: "button", 
                description: "Click the Login button in form (should prefer <button> elements)"
            }
        ]
    };
    
    // Test Case 3: Default behavior (should click button first)
    const defaultLoginTest = {
        name: "Default Login Click",
        description: "Test default behavior when no elementType is specified",
        url: testPageUrl,
        actions: [
            {
                type: "navigate",
                value: testPageUrl, 
                description: "Navigate to test page"
            },
            {
                type: "click",
                selector: "text=Login",
                description: "Click Login without elementType (should default to button priority)"
            }
        ]
    };
    
    console.log('📝 Test Case 1 - Navbar Link:');
    console.log(JSON.stringify(navbarLoginTest, null, 2));
    
    console.log('\n📝 Test Case 2 - Form Button:');
    console.log(JSON.stringify(formLoginTest, null, 2));
    
    console.log('\n📝 Test Case 3 - Default Behavior:');
    console.log(JSON.stringify(defaultLoginTest, null, 2));
    
    console.log('\n✅ Demo test cases created!');
    console.log('\n💡 Usage Instructions:');
    console.log('1. Start the server: npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Register/login to the application');
    console.log('4. Create test cases using the JSON above');
    console.log('5. Run the tests to see how elementType affects element selection');
    
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('- elementType: "link" prioritizes <a> elements');
    console.log('- elementType: "button" prioritizes <button> elements');
    console.log('- No elementType defaults to button priority');
    console.log('- All cases handle text="Login" but click different elements');
    
    return { navbarLoginTest, formLoginTest, defaultLoginTest };
}

if (require.main === module) {
    createDemoTestCases();
}

module.exports = { createDemoTestCases };