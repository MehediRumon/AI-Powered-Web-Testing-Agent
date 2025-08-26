const { validateActions } = require('./src/routes/test');

// Extract the validateActions function to test it separately

// Extract the validateActions function to test it separately
function validateAndSanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
    }
    
    // Remove potentially dangerous characters
    const sanitized = url.trim().replace(/[<>'"]/g, '');
    
    // Basic URL validation
    if (!sanitized.match(/^https?:\/\/.+/) && !sanitized.startsWith('/')) {
        throw new Error('URL must be a valid HTTP/HTTPS URL or start with /');
    }
    
    return sanitized;
}

// Test validation pipeline
function testValidateActions(actions) {
    if (!actions) return [];
    
    if (!Array.isArray(actions)) {
        throw new Error('Actions must be an array');
    }
    
    const allowedActionTypes = ['navigate', 'input', 'click', 'verify', 'wait', 'assert_visible', 'assert_text', 'fill', 'type', 'select', 'check', 'uncheck', 'hover', 'scroll'];
    
    return actions.map((action, index) => {
        if (!action.type) {
            throw new Error(`Action ${index + 1} must have a type`);
        }
        
        if (!allowedActionTypes.includes(action.type)) {
            throw new Error(`Invalid action type: ${action.type}`);
        }
        
        // Sanitize string fields (preserve quotes in selectors for CSS)
        const sanitized = {
            type: action.type,
            locator: action.locator ? action.locator.replace(/[<>]/g, '') : undefined,
            selector: action.selector ? action.selector.replace(/[<>]/g, '') : undefined,
            value: action.value ? action.value.replace(/[<>]/g, '') : undefined,
            description: action.description ? action.description.replace(/[<>]/g, '') : undefined,
            expectedUrl: action.expectedUrl ? action.expectedUrl.replace(/[<>'\"]/g, '') : undefined
        };
        
        return sanitized;
    });
}

async function testValidationPipeline() {
    const OpenAIService = require('./src/services/openai');
    const aiService = new OpenAIService();
    
    const instructions = `Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".`;

    console.log('Testing validation pipeline...');
    
    // Get the parsed result
    const parsed = await aiService.parseTestInstructions(instructions);
    console.log('\n1. Raw parsed actions:');
    console.log(JSON.stringify(parsed.testCase.actions, null, 2));
    
    // Apply validation
    const validated = testValidateActions(parsed.testCase.actions);
    console.log('\n2. After validation:');
    console.log(JSON.stringify(validated, null, 2));
}

testValidationPipeline();