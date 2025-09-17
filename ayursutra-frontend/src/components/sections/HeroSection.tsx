"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
export default function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.png')",
        }}
      />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/60" />

      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-200/30 via-purple-200/20 to-pink-200/10"
      />

      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 px-6 py-3 text-sm bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200 hover-glow rounded-full"
            >
              🧘‍♀️ Traditional Medicine • Modern Technology
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-bold tracking-tight"
          >
            <span className="gradient-text-indigo text-shadow-lg">
              AyurSutra
            </span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl md:text-4xl font-semibold text-gray-700"
          >
            Panchakarma Patient Management & Therapy Scheduling
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mx-auto max-w-4xl text-xl text-gray-600 leading-relaxed"
          >
            Transform your Panchakarma center with our modern, intuitive
            platform designed for{" "}
            <span className="font-semibold text-indigo-600">patients</span>,{" "}
            <span className="font-semibold text-purple-600">therapists</span>,
            and{" "}
            <span className="font-semibold text-pink-600">administrators</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05, rotateX: 5 }}
                whileTap={{ scale: 0.95 }}
                className="perspective-1000"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl px-8 py-4 text-lg font-semibold animate-gradient hover-glow rounded-2xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#features">
              <motion.div
                whileHover={{ scale: 1.05, rotateX: -5 }}
                whileTap={{ scale: 0.95 }}
                className="perspective-1000"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-indigo-300 hover:border-indigo-500 hover:text-indigo-600 px-8 py-4 text-lg font-semibold rounded-2xl bg-white/80 backdrop-blur-sm hover-glow"
                >
                  Explore Features
                </Button>
              </motion.div>
            </Link>

            <motion.div
              whileHover={{ scale: 1.05, rotateX: 5 }}
              whileTap={{ scale: 0.95 }}
              className="perspective-1000"
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl px-8 py-4 text-lg font-semibold animate-gradient hover-glow rounded-2xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
