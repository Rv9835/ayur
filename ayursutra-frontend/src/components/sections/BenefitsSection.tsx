"use client";
import { motion } from "framer-motion";
import { Users, Shield, Heart } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Multi-Role Support",
    description:
      "Dedicated dashboards for patients, therapists, and administrators.",
    color: "from-indigo-500 to-purple-500",
    bgColor: "from-indigo-100 to-purple-100",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description:
      "HIPAA-compliant data handling with enterprise-grade security.",
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-100 to-emerald-100",
  },
  {
    icon: Heart,
    title: "Patient-Centric",
    description: "Focus on holistic wellness with personalized care plans.",
    color: "from-pink-500 to-rose-500",
    bgColor: "from-pink-100 to-rose-100",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-32 bg-gradient-to-br from-white via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-indigo-100/20 to-blue-100/20 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-6 text-shadow">
            Why Choose AyurSutra?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for Panchakarma centers with deep understanding
            of traditional healing practices.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="text-center perspective-1000"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className={`mx-auto w-24 h-24 bg-gradient-to-br ${benefit.bgColor} rounded-full flex items-center justify-center mb-8 shadow-lg hover-glow`}
              >
                <benefit.icon
                  className={`w-12 h-12 bg-gradient-to-r ${benefit.color} bg-clip-text text-transparent`}
                />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-shadow">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
