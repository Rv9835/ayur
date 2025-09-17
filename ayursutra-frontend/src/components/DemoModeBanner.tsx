"use client";

import { useState, useEffect } from "react";

export default function DemoModeBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if we're in demo mode by looking for demo-related console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes("demo mode") || args[0]?.includes("Backend unavailable")) {
        setIsDemoMode(true);
      }
      originalWarn.apply(console, args);
    };

    // Also check for demo mode indicators in localStorage
    const checkDemoMode = () => {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const state = parsed?.state ?? parsed;
          const uid = state?.uid;
          // If we have a demo UID or no valid JWT token, we're in demo mode
          if (uid === "demo-patient-123" || !uid) {
            setIsDemoMode(true);
          }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    };

    checkDemoMode();

    // Clean up
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  if (!isDemoMode) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            Demo Mode Active
          </p>
          <p className="text-sm mt-1">
            The backend is currently unavailable. You're viewing demo data and functionality may be limited.
          </p>
        </div>
      </div>
    </div>
  );
}
