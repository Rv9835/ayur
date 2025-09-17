"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "Chief Therapist",
    content:
      "AyurSutra has revolutionized our practice. The scheduling system is intuitive and our patients love the mobile app.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Center Director",
    content:
      "The analytics dashboard gives us insights we never had before. Our efficiency has improved by 40%.",
    rating: 5,
  },
  {
    name: "Anita Patel",
    role: "Patient",
    content:
      "Booking appointments and tracking my therapy progress has never been easier. Highly recommended!",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse-slow"
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
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied users who trust AyurSutra for their
            practice management.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="perspective-1000"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover-lift">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: j * 0.1 }}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                      >
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-shadow">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
