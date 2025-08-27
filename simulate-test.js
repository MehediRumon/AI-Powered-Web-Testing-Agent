// Simple test to simulate the multi-selector issue
console.log('🔍 Simulating Multi-Selector Dropdown Issue');
console.log('==========================================\n');

// Simulate the exact logic from handleSelectAction
function simulateHandleSelectAction(elementSelector, value) {
    console.log(`Testing selector: "${elementSelector}" with value: "${value}"`);
    
    // Parse multiple selectors if comma-separated (same as real code)
    const selectors = elementSelector.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Split into ${selectors.length} selectors:`, selectors);
    
    let lastError = null;
    
    // Try each selector sequentially (same as real code)
    for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        console.log(`\n  Trying selector ${i + 1}/${selectors.length}: ${selector}`);
        
        // Simulate what would happen in trySelectWithFallbacks
        const result = simulateTrySelectWithFallbacks(selector, value);
        
        if (result.success) {
            console.log(`✅ SUCCESS: Selected '${value}' using selector '${selector}' via ${result.method}`);
            return { success: true, selector, method: result.method };
        } else {
            console.log(`❌ FAILED: ${result.error}`);
            lastError = result.error;
        }
    }
    
    // If all selectors failed
    console.log(`\n💥 ALL SELECTORS FAILED. Last error: ${lastError}`);
    return { success: false, error: lastError };
}

function simulateTrySelectWithFallbacks(selector, value) {
    // Simulate what the actual dropdown elements contain
    const dropdownData = {
        '#teachergrade': [
            { value: '', text: 'Select Grade' },
            { value: 'level-01', text: 'Level-01' },
            { value: 'level-02', text: 'Level-02' },
            { value: 'level-03', text: 'Level-03' }
        ],
        '#teachergradeType': [
            { value: '', text: 'Select Grade Type' },
            { value: 'level-01', text: 'Level-01' },
            { value: 'level-02', text: 'Level-02' },
            { value: 'level-03', text: 'Level-03' }
        ],
        'select[name=teachergrade]': [
            { value: '', text: 'Select Grade' },
            { value: 'level-01', text: 'Level-01' },
            { value: 'level-02', text: 'Level-02' },
            { value: 'level-03', text: 'Level-03' }
        ],
        'select[name=teachergradeType]': [
            { value: '', text: 'Select Grade Type' },
            { value: 'level-01', text: 'Level-01' },
            { value: 'level-02', text: 'Level-02' },
            { value: 'level-03', text: 'Level-03' }
        ],
        '#religion': [
            { value: '', text: 'Select Religion' },
            { value: 'islam', text: 'Islam' },
            { value: 'christianity', text: 'Christianity' },
            { value: 'hinduism', text: 'Hinduism' },
            { value: 'buddhism', text: 'Buddhism' }
        ],
        '#religionType': [
            { value: '', text: 'Select Religion Type' },
            { value: 'islam', text: 'Islam' },
            { value: 'christianity', text: 'Christianity' },
            { value: 'hinduism', text: 'Hinduism' },
            { value: 'buddhism', text: 'Buddhism' }
        ],
        'select[name=religion]': [
            { value: '', text: 'Select Religion' },
            { value: 'islam', text: 'Islam' },
            { value: 'christianity', text: 'Christianity' },
            { value: 'hinduism', text: 'Hinduism' },
            { value: 'buddhism', text: 'Buddhism' }
        ],
        'select[name=religionType]': [
            { value: '', text: 'Select Religion Type' },
            { value: 'islam', text: 'Islam' },
            { value: 'christianity', text: 'Christianity' },
            { value: 'hinduism', text: 'Hinduism' },
            { value: 'buddhism', text: 'Buddhism' }
        ]
    };
    
    const options = dropdownData[selector];
    if (!options) {
        return { success: false, error: `Element not found for selector: ${selector}` };
    }
    
    console.log(`    Available options:`, options.filter(opt => opt.value !== ''));
    
    // 1. Try by value (same as Playwright selectOption(selector, value))
    let matchingOption = options.find(opt => opt.value === value);
    if (matchingOption) {
        console.log(`    ✅ Match by value: ${value} → ${matchingOption.value}`);
        return { success: true, method: 'value', matchedValue: matchingOption.value };
    }
    console.log(`    ❌ No match by value: ${value}`);
    
    // 2. Try by label/text (same as Playwright selectOption(selector, { label: value }))
    matchingOption = options.find(opt => opt.text === value);
    if (matchingOption) {
        console.log(`    ✅ Match by label/text: ${value} → ${matchingOption.text} (value: ${matchingOption.value})`);
        return { success: true, method: 'label', matchedValue: matchingOption.value };
    }
    console.log(`    ❌ No match by label/text: ${value}`);
    
    // 3. Try case-insensitive value
    const lowerValue = value.toLowerCase();
    matchingOption = options.find(opt => opt.value.toLowerCase() === lowerValue);
    if (matchingOption) {
        console.log(`    ✅ Match by case-insensitive value: ${lowerValue} → ${matchingOption.value}`);
        return { success: true, method: 'case-insensitive-value', matchedValue: matchingOption.value };
    }
    console.log(`    ❌ No match by case-insensitive value: ${lowerValue}`);
    
    // 4. Try case-insensitive text (my new fix)
    matchingOption = options.find(opt => opt.text.toLowerCase() === value.toLowerCase());
    if (matchingOption) {
        console.log(`    ✅ Match by case-insensitive text: ${value} → ${matchingOption.text} (value: ${matchingOption.value})`);
        return { success: true, method: 'case-insensitive-text', matchedValue: matchingOption.value };
    }
    console.log(`    ❌ No match by case-insensitive text: ${value}`);
    
    return { success: false, error: `No matching option found for '${value}' in ${selector}` };
}

// Test the exact failing scenarios from the problem statement
console.log('=== TEST 1: Teacher Grade ===');
const teacherGradeResult = simulateHandleSelectAction(
    '#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]',
    'Level-01'
);

console.log('\n=== TEST 2: Religion ===');
const religionResult = simulateHandleSelectAction(
    '#religion, #religionType, select[name=religion], select[name=religionType]',
    'Islam'
);

console.log('\n=== RESULTS ===');
console.log('Teacher Grade:', teacherGradeResult.success ? '✅ SUCCESS' : '❌ FAILED');
console.log('Religion:', religionResult.success ? '✅ SUCCESS' : '❌ FAILED');

console.log('\n🏁 Simulation completed');