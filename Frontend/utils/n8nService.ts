import axios from "axios";
import Constants from "expo-constants";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface N8NResponse {
  output?: string;
  [key: string]: any;
}

/**
 * Service to interact with N8N workflow for itinerary planning
 * The workflow should be accessible via webhook endpoint
 */
class N8NService {
  private baseUrl: string;
  private sessionId: string | null = null;
  private groupId: string | null = null;

  constructor() {
    // For localhost on mobile, use your computer's IP address
    // For Android emulator: use 10.0.2.2 instead of localhost
    // For iOS simulator: use localhost or your computer's IP
    this.baseUrl =
      Constants.expoConfig?.extra?.N8N_URL || "http://localhost:5678";

    // Generate a session ID for this conversation
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set the group ID for group-scoped conversations
   */
  setGroupId(groupId: string | number): void {
    this.groupId = String(groupId);
    // Reset session when switching groups
    this.sessionId = `group_${this.groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the current group ID
   */
  getGroupId(): string | null {
    return this.groupId;
  }

  /**
   * Send a message to the N8N workflow
   * @param text - User's query text
   * @returns Response from N8N workflow (extracted from array format)
   */
  async sendMessage(text: string): Promise<N8NResponse> {
    try {
      // Construct the webhook URL
      // Replace 'webhook' with your actual N8N webhook path
      // Example: http://localhost:5678/webhook/itinerary-planning
      const webhookUrl = `${this.baseUrl}`;

      // Prepare the payload - simple format with text and sessionId
      const payload = {
        text: text,
        sessionId: this.sessionId,
      };

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Handle response format: [{ "output": "..." }]
      // Extract the output from the array
      if (Array.isArray(response.data) && response.data.length > 0) {
        const firstItem = response.data[0];
        if (
          firstItem &&
          typeof firstItem === "object" &&
          "output" in firstItem
        ) {
          return {
            output: firstItem.output,
          };
        }
      }

      // Fallback: if response is not in expected format, return as-is
      return response.data;
    } catch (error: any) {
      console.error("N8N Service Error:", error);

      // Handle different error scenarios
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Cannot connect to N8N workflow. Please ensure:\n" +
            "1. N8N is running on your localhost\n" +
            "2. For Android emulator, use 10.0.2.2 instead of localhost\n" +
            "3. For iOS simulator, use your computer's IP address\n" +
            "4. The webhook endpoint is correct"
        );
      }

      if (error.response) {
        // Server responded with error status
        throw new Error(
          `N8N workflow error: ${error.response.data?.message || error.response.statusText}`
        );
      }

      throw new Error(
        `Failed to communicate with N8N workflow: ${error.message}`
      );
    }
  }

  /**
   * Reset the session (start a new conversation)
   * @param groupId - Optional group ID to include in session ID for group-specific sessions
   */
  resetSession(groupId?: number | string): void {
    if (groupId) {
      this.groupId = String(groupId);
      this.sessionId = `group_${this.groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (this.groupId) {
      this.sessionId = `group_${this.groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Clear group context
   */
  clearGroupId(): void {
    this.groupId = null;
    this.resetSession();
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Update the base URL (useful for switching between localhost and production)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

// Export a singleton instance
export const n8nService = new N8NService();
