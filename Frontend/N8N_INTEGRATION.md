# N8N Workflow Integration Guide

This guide explains how to integrate your self-hosted N8N workflow with the Expensely mobile application.

## Overview

The integration allows users to chat with an N8N workflow that plans itineraries **within group contexts**. When users open a group, they can access the itinerary planning chat feature. This enables groups to plan trips together and manage trip expenses all in one place.

## Setup Instructions

### 1. Configure N8N URL

Add the `N8N_URL` environment variable to your `.env` file in the `Frontend` directory:

```env
N8N_URL=http://localhost:5678
```

**Important Notes for Mobile Development:**

- **Android Emulator**: Use `10.0.2.2` instead of `localhost`
  ```env
  N8N_URL=http://10.0.2.2:5678
  ```

- **iOS Simulator**: Use `localhost` or your computer's IP address
  ```env
  N8N_URL=http://localhost:5678
  # OR
  N8N_URL=http://192.168.1.XXX:5678  # Replace with your computer's IP
  ```

- **Physical Device**: Use your computer's IP address on the same network
  ```env
  N8N_URL=http://192.168.1.XXX:5678  # Replace with your computer's IP
  ```

### 2. Configure N8N Webhook

Your N8N workflow should expose a webhook endpoint. The default path expected by the app is:

```
POST http://localhost:5678/webhook/itinerary-planning
```

**To customize the webhook path**, edit `Frontend/utils/n8nService.ts` and update the `webhookUrl` in the `sendMessage` method.

### 3. N8N Workflow Expected Format

The mobile app sends the following payload to your N8N workflow:

```json
{
  "text": "User's query text",
  "sessionId": "group_123_1234567890_abc123"
}
```

**Key Points:**
- `text`: Contains the user's query/message
- `sessionId`: Auto-generated session ID that remains the same for the entire conversation session
- Session ID format: `group_{groupId}_{timestamp}_{random}` for group chats, or `session_{timestamp}_{random}` for standalone chats
- The sessionId persists throughout the conversation, allowing your workflow to maintain context

**Expected Response Format:**

Your N8N workflow should return a JSON response in the following array format:

```json
[
  {
    "output": "Hello again!\n\nI'm ready to help you plan your trip. Please tell me:\n\n*   **Destination:** Where are you dreaming of going?\n*   **Duration:** How many days or weeks will you be traveling?\n*   **Budget:** What's your approximate budget for this adventure?\n*   **Members:** Who are you traveling with?\n*   **Trip Type:** What kind of experience are you hoping for (e.g., adventure, relaxation, cultural immersion, family fun, romantic getaway)?"
  }
]
```

**Important:**
- The response must be an **array** containing at least one object
- The object must have an `output` key containing the response text
- The `output` text will be displayed directly in the chat interface
- Markdown formatting in the output text will be preserved (though not rendered as markdown in the current implementation)

### 4. Testing the Integration

1. **Start your N8N workflow** on localhost:5678
2. **Ensure the webhook is active** and accessible
3. **Run the mobile app**:
   ```bash
   cd Frontend
   npm start
   ```
4. **Navigate to the "Groups" tab** in the app
5. **Open a group** (or create a new one)
6. **Tap "Plan Itinerary"** button in the group details screen
7. **Start chatting** with the itinerary planner

### 5. Troubleshooting

#### Connection Refused Error

If you see "Cannot connect to N8N workflow":

1. **Check N8N is running**: Open `http://localhost:5678` in your browser
2. **Verify webhook URL**: Check that your webhook path matches the one in `n8nService.ts`
3. **Check network settings**:
   - Android emulator: Use `10.0.2.2` instead of `localhost`
   - Physical device: Ensure device and computer are on the same network
   - Firewall: Allow connections on port 5678

#### Wrong IP Address for Physical Device

To find your computer's IP address:

- **Windows**: Run `ipconfig` in Command Prompt, look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr`, look for inet address

#### Webhook Not Responding

1. **Test webhook directly**: Use Postman or curl to test your N8N webhook
   ```bash
   curl -X POST http://localhost:5678/webhook/itinerary-planning \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

2. **Check N8N workflow logs**: Look for errors in the N8N execution history
3. **Verify webhook is active**: Ensure the workflow is activated in N8N

## Code Structure

- **`Frontend/utils/n8nService.ts`**: Service layer for N8N API communication with group context support
- **`Frontend/components/ItineraryChat/GroupChatInterface.tsx`**: Group-specific chat UI component
- **`Frontend/app/groupDetails.tsx`**: Group details screen with "Plan Itinerary" button integration

## Customization

### Changing the Webhook Path

Edit `Frontend/utils/n8nService.ts`:

```typescript
const webhookUrl = `${this.baseUrl}/webhook/your-custom-path`;
```

### Modifying the Chat UI

Edit `Frontend/components/ItineraryChat/ChatInterface.tsx` to customize:
- Message bubble styles
- Colors and themes
- Input behavior
- Loading indicators

### Handling Itinerary Data

Edit `Frontend/app/(tabs)/itinerary.tsx` to customize how itinerary data is displayed in the modal.

## Security Considerations

For production use:

1. **Use HTTPS**: Configure N8N with SSL/TLS
2. **Add Authentication**: Implement API keys or OAuth in your N8N workflow
3. **Validate Input**: Add input validation in your N8N workflow
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Support

If you encounter issues:

1. Check N8N workflow execution logs
2. Review browser/device console for errors
3. Verify network connectivity between device and N8N server
4. Test webhook endpoint directly with curl/Postman

