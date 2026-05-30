import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

const STORE_NAME_KEY = "nexcart_store_name";

// Shared BroadcastChannel for instant cross-tab updates
let channel = null;
try {
  channel = new BroadcastChannel("store_name_sync");
} catch (_) {
  // BroadcastChannel not supported (very old browsers) — fall back to storage event
}

export function useStoreName() {
  const [storeName, setStoreName] = useState(
    localStorage.getItem(STORE_NAME_KEY) || "NexCart"
  );

  useEffect(() => {
    // Always fetch fresh from server — cache: "no-store" prevents stale browser cache
    const fetchName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`, {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          const name = data?.store?.storeName || "NexCart";
          setStoreName(name);
          localStorage.setItem(STORE_NAME_KEY, name);
        }
      } catch (error) {
        console.error("Error fetching store name:", error);
      }
    };

    fetchName();

    // BroadcastChannel: fires in ALL tabs (including same tab) when admin saves
    const handleBroadcast = (e) => {
      if (e.data?.type === "STORE_NAME_UPDATED" && e.data?.name) {
        setStoreName(e.data.name);
        localStorage.setItem(STORE_NAME_KEY, e.data.name);
      }
    };
    channel?.addEventListener("message", handleBroadcast);

    // Fallback: native storage event fires in OTHER tabs when localStorage changes
    const handleStorageEvent = (e) => {
      if (e.key === STORE_NAME_KEY && e.newValue) {
        setStoreName(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Same-tab custom event (for same-tab immediate update)
    const handleSameTabUpdate = () => {
      const updated = localStorage.getItem(STORE_NAME_KEY);
      if (updated) setStoreName(updated);
    };
    window.addEventListener("storeNameUpdated", handleSameTabUpdate);

    return () => {
      channel?.removeEventListener("message", handleBroadcast);
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("storeNameUpdated", handleSameTabUpdate);
    };
  }, []);

  return storeName;
}

// Called by SettingsPage after a successful save to instantly sync all tabs
export function broadcastStoreNameUpdate(name) {
  localStorage.setItem(STORE_NAME_KEY, name);
  // BroadcastChannel: notifies ALL tabs immediately
  try {
    channel?.postMessage({ type: "STORE_NAME_UPDATED", name });
  } catch (_) {}
  // Same-tab custom event
  window.dispatchEvent(new CustomEvent("storeNameUpdated"));
}

