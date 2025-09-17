"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AuthProvider from "@/components/auth/AuthProvider";
import DemoModeBanner from "@/components/DemoModeBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <DemoModeBanner />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
