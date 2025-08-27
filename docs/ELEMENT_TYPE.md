# elementType Parameter Documentation

## Overview

The `elementType` parameter is a new optional field for click actions that allows users to specify which type of element to prioritize when multiple elements contain the same text.

## Problem Solved

When a webpage contains multiple elements with the same text (e.g., "Login" appears as both a button and a navbar link), the testing agent previously had no way to specify which element type to click. This often led to unpredictable behavior or clicking the wrong element.

## Solution

The `elementType` parameter provides element type prioritization for text-based click actions.

## Usage

### Syntax

```json
{
  "type": "click",
  "selector": "text=Login",
  "elementType": "button|link|select|generic",
  "description": "Click description"
}
```

### Supported Element Types

- **`button`**: Prioritizes `<button>`, `<input type="submit">`, `<input type="button">`, `[role="button"]` elements
- **`link`**: Prioritizes `<a>`, `[role="link"]` elements  
- **`select`**: Prioritizes `<select>`, `<option>`, `[role="combobox"]`, `[role="listbox"]` elements
- **`generic`**: Uses generic selectors like `[onclick]`, `*:has-text()` etc.

### Examples

#### Clicking a Button
```json
{
  "type": "click",
  "selector": "text=Login",
  "elementType": "button",
  "description": "Click the Login button in the form"
}
```

#### Clicking a Link
```json
{
  "type": "click", 
  "selector": "text=Login",
  "elementType": "link",
  "description": "Click the Login link in the navbar"
}
```

#### Clicking a Select/Dropdown Option
```json
{
  "type": "click",
  "selector": "text=United States",
  "elementType": "select",
  "description": "Click the United States option in country dropdown"
}
```

#### Default Behavior (No elementType)
```json
{
  "type": "click",
  "selector": "text=Login",
  "description": "Click Login (defaults to button priority)"
}
```

## Implementation Details

### Selector Priority

When `elementType` is specified, the system builds a prioritized list of selectors:

1. **First**: Selectors matching the specified element type
2. **Then**: Button selectors (if not the specified type)
3. **Then**: Link selectors (if not the specified type)  
4. **Then**: Select selectors (if not the specified type)
5. **Finally**: Generic selectors

### Backward Compatibility

- Existing test cases without `elementType` continue to work unchanged
- Default behavior prioritizes button elements (maintains existing behavior)
- No breaking changes to existing APIs

### Error Handling

- If no elements of the specified type are found, the system falls back to the default selector priority
- Comprehensive error messages include information about available elements when clicks fail

## Testing

The implementation includes:
- Unit tests for selector building logic
- Integration tests with sample HTML pages
- Demonstration test cases showing the functionality in action

## Benefits

1. **Precision**: Users can specify exactly which type of element to click
2. **Reliability**: Reduces ambiguity in automated tests
3. **Maintainability**: Test cases are more explicit and self-documenting
4. **Flexibility**: Supports complex scenarios with multiple similar elements