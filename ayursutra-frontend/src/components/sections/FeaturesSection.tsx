"use client";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Activity, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Automated appointment booking with real-time availability and conflict resolution.",
    color: "from-indigo-400 to-purple-400",
    bgColor: "from-indigo-50 to-purple-50",
  },
  {
    icon: Activity,
    title: "Therapy Tracking",
    description:
      "Monitor patient progress with detailed session logs and wellness metrics.",
    color: "from-purple-400 to-pink-400",
    bgColor: "from-purple-50 to-pink-50",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Comprehensive insights into center performance and patient outcomes.",
    color: "from-pink-500 to-rose-500",
    bgColor: "from-pink-50 to-rose-50",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-32 bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-purple-100/30 to-pink-100/30 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
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
            Everything You Need to Manage Your Center
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline operations, enhance patient care, and grow your practice
            with our comprehensive platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -10, rotateY: 5 }}
              className="perspective-1000"
            >
              <Card
                className={`h-full hover:shadow-2xl transition-all duration-500 border-0 shadow-lg group bg-gradient-to-br ${feature.bgColor} hover-lift`}
              >
                <CardHeader className="text-center pb-6">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`mx-auto w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg hover-glow`}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-gray-900 text-shadow">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
