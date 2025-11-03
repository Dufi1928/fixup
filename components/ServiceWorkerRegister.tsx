"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const swUrl = "/sw.js";
      // Delay a bit to avoid competing with initial load
      const register = () => {
        navigator.serviceWorker
          .register(swUrl)
          .catch((err) => console.warn("SW registration failed:", err));
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register, { once: true });
      }
    }
  }, []);

  return null;
}
