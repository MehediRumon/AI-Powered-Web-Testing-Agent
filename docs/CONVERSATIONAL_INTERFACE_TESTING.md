# Conversational Interface Testing - Bengali/Bangla Support

## Overview

The AI-Powered Web Testing Agent now supports testing conversational interfaces, including Bengali/Bangla multilingual chat scenarios. This enhancement enables testing of e-commerce product selection conversations, customer service chat flows, and multilingual customer-business interactions.

## Problem Statement Addressed

The implementation addresses the specific conversational flow:

```
C- Hello
P- নমস্কার! 🛒 আমরা রক স্টার, উন্নত মানের পণ্য সরবরাহ করি। আমাদের সাথে যোগাযোগ করুন আপনার প্রয়োজন জানানোর জন্য! 💰 📦
C- ki ki product ase?
P- আমাদের এখানে Polo Black এবং Polo White আছে 🛒। আপনি কোনটি কিনতে চান? দাম জানতে চান?
```

## New Action Types

### 1. `send_message`
Send messages in chat interface with automatic send button detection or Enter key fallback.

```json
{
  "type": "send_message",
  "selector": "#messageInput",
  "value": "ki ki product ase?",
  "description": "Ask about available products in Bengali"
}
```

### 2. `verify_chat_response`
Verify that chat responses contain expected content, supporting multilingual text.

```json
{
  "type": "verify_chat_response",
  "selector": ".business-message:last-child",
  "value": "Polo Black এবং Polo White",
  "description": "Verify response mentions both products"
}
```

### 3. `select_product`
Select products from conversational interface with smart selector detection.

```json
{
  "type": "select_product",
  "selector": "#polo-black",
  "value": "Polo Black",
  "description": "Select Polo Black product"
}
```

### 4. `verify_conversation_state`
Verify conversation state and context tracking.

```json
{
  "type": "verify_conversation_state",
  "selector": "#resultArea",
  "value": "Polo Black selected",
  "description": "Verify product selection state"
}
```

## Bengali/Bangla Language Support

### Recognized Patterns
- `ki ki product ase?` - Product inquiry
- `দাম জানতে চান?` - Price inquiry
- `নমস্কার! 🛒` - Bengali greeting with shopping emoji
- `Polo Black এবং Polo White` - Product names in Bengali context

### Natural Language Test Examples

```
Send message "Hello"
Verify response contains "নমস্কার! 🛒"
Send message "ki ki product ase?"
Verify response contains "Polo Black এবং Polo White"
Select product "Polo Black"
Ask for price "দাম জানতে চান?"
Verify conversation state "Polo Black selected"
```

## Files Added

### 1. `tests/test-page-chat-conversation.html`
Interactive test page simulating Bengali product selection chat:
- Customer-Business conversation interface
- Product selection buttons (Polo Black/White)
- Price inquiry functionality
- Conversation state tracking
- Multilingual message input

### 2. `tests/test-conversational-interface.js`
Comprehensive test suite for conversational interface:
- Tests parsing of conversational scenarios
- Validates Bengali/Bangla content handling
- Tests exact problem statement scenario
- Browser automation testing

## Enhanced Services

### OpenAI Service (`src/services/openai.js`)
- Added `isConversationalAction()` method
- Added `parseConversationalInstruction()` method
- Enhanced fallback parsing with conversational action priority
- Supports Bengali/Bangla pattern recognition

### Playwright Service (`src/services/playwright.js`)
- Added `handleSendMessage()` method
- Added `handleVerifyChatResponse()` method
- Added `handleSelectProduct()` method
- Added `handleVerifyConversationState()` method

## Usage Examples

### Basic Conversational Test
```javascript
const testCase = {
  name: "Bengali Product Chat",
  url: "file://path/to/test-page-chat-conversation.html",
  actions: [
    {
      type: "send_message",
      selector: "#messageInput",
      value: "Hello",
      description: "Start conversation"
    },
    {
      type: "verify_chat_response",
      selector: ".business-message:last-child",
      value: "নমস্কার",
      description: "Verify Bengali greeting"
    },
    {
      type: "select_product",
      selector: "#polo-black",
      value: "Polo Black",
      description: "Select product"
    }
  ]
};
```

### Natural Language Test Creation
```javascript
const instructions = `
Test: Bengali Product Selection
Send message "ki ki product ase?"
Verify response contains "Polo Black এবং Polo White"
Select product "Polo Black"
Verify conversation state "Polo Black selected"
`;

const parsed = openaiService.fallbackParse(instructions);
// Automatically generates appropriate conversational actions
```

## Testing Capabilities

The enhanced system can now test:

✅ **Bengali/Bangla chat conversations**
✅ **Product selection from conversational interfaces**
✅ **Multilingual customer-business interactions**
✅ **E-commerce chat flows with price inquiries**
✅ **Conversation state and context tracking**
✅ **Message sending with automatic send button detection**
✅ **Response verification with multilingual content**

## Backward Compatibility

All existing functionality remains intact. The new conversational actions work alongside existing action types like `click`, `fill`, `select`, etc.

## Future Enhancements

Potential future improvements:
- Voice message testing
- Image/media sharing in chat
- Multi-turn conversation flow validation
- Advanced conversation analytics
- More language support (Arabic, Hindi, etc.)
- Real-time chat testing with WebSocket support