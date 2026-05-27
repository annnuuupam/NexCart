import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

export function useStoreName() {
  const [storeName, setStoreName] = useState(
    sessionStorage.getItem("storeName") || "NexCart"
  );

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          const name = data?.store?.storeName || "NexCart";
          setStoreName(name);
          sessionStorage.setItem("storeName", name);
          
          // Dynamically replace "NexCart" in document title if matched
          if (document.title.includes("NexCart")) {
            document.title = document.title.replace("NexCart", name);
          }
        }
      } catch (error) {
        console.error("Error fetching store name:", error);
      }
    };

    fetchName();
  }, []);

  return storeName;
}
