import * as SecureStore from "expo-secure-store";
import { ChatMessage } from "./n8nService";

const CHAT_HISTORY_PREFIX = "chat_history_";
const ITINERARY_PREFIX = "itinerary_";

/**
 * Save chat history for a specific group
 */
export const saveChatHistory = async (
  groupId: string | number,
  messages: ChatMessage[]
): Promise<void> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${groupId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

/**
 * Load chat history for a specific group
 */
export const loadChatHistory = async (
  groupId: string | number
): Promise<ChatMessage[]> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${groupId}`;
    const historyString = await SecureStore.getItemAsync(key);
    if (historyString) {
      const messages = JSON.parse(historyString);
      // Convert timestamp strings back to Date objects
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
};

/**
 * Clear chat history for a specific group
 */
export const clearChatHistory = async (
  groupId: string | number
): Promise<void> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${groupId}`;
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

export interface SavedItinerary {
  id: string;
  groupId: string | number;
  title: string;
  itinerary: any;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  notes?: string;
}

/**
 * Save an itinerary for a group
 */
export const saveItinerary = async (
  groupId: string | number,
  itinerary: any,
  title?: string,
  notes?: string
): Promise<SavedItinerary> => {
  try {
    const itineraryId = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const savedItinerary: SavedItinerary = {
      id: itineraryId,
      groupId,
      title: title || `Itinerary ${new Date().toLocaleDateString()}`,
      itinerary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      notes,
    };

    // Get existing itineraries
    const existing = await getGroupItineraries(groupId);
    
    // Add new itinerary
    const updated = [...existing, savedItinerary];
    
    // Save back
    const key = `${ITINERARY_PREFIX}${groupId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(updated));

    return savedItinerary;
  } catch (error) {
    console.error("Error saving itinerary:", error);
    throw error;
  }
};

/**
 * Get all itineraries for a group
 */
export const getGroupItineraries = async (
  groupId: string | number
): Promise<SavedItinerary[]> => {
  try {
    const key = `${ITINERARY_PREFIX}${groupId}`;
    const itinerariesString = await SecureStore.getItemAsync(key);
    if (itinerariesString) {
      return JSON.parse(itinerariesString);
    }
    return [];
  } catch (error) {
    console.error("Error loading itineraries:", error);
    return [];
  }
};

/**
 * Update an itinerary
 */
export const updateItinerary = async (
  groupId: string | number,
  itineraryId: string,
  updates: Partial<SavedItinerary>
): Promise<void> => {
  try {
    const itineraries = await getGroupItineraries(groupId);
    const updated = itineraries.map((it) =>
      it.id === itineraryId
        ? { ...it, ...updates, updatedAt: new Date().toISOString() }
        : it
    );

    const key = `${ITINERARY_PREFIX}${groupId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Error updating itinerary:", error);
    throw error;
  }
};

/**
 * Delete an itinerary
 */
export const deleteItinerary = async (
  groupId: string | number,
  itineraryId: string
): Promise<void> => {
  try {
    const itineraries = await getGroupItineraries(groupId);
    const updated = itineraries.filter((it) => it.id !== itineraryId);

    const key = `${ITINERARY_PREFIX}${groupId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    throw error;
  }
};

/**
 * Set active itinerary (deactivates others)
 */
export const setActiveItinerary = async (
  groupId: string | number,
  itineraryId: string
): Promise<void> => {
  try {
    const itineraries = await getGroupItineraries(groupId);
    const updated = itineraries.map((it) => ({
      ...it,
      isActive: it.id === itineraryId,
    }));

    const key = `${ITINERARY_PREFIX}${groupId}`;
    await SecureStore.setItemAsync(key, JSON.stringify(updated));
  } catch (error) {
    console.error("Error setting active itinerary:", error);
    throw error;
  }
};

