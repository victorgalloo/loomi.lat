"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Building2, Phone, Mail, Send, ChevronUp, ArrowRight, Check } from "lucide-react";
import type { Language } from "@/types/landing";
import { getTranslations } from "@/lib/translations";
import { Container } from "./shared";
import { company, styles, animations, viewport } from "@/lib/constants";

interface ContactProps {
  language: Language;
}

/**
 * Contact section with expandable form
 */
export default function Contact({ language }: ContactProps) {
  const t = getTranslations("contact", language);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ company: "", phone: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-open form when navigating from hero CTA
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#contact-form") {
        setShowForm(true);
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          setTimeout(() => {
            contactSection.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el formulario");
      }

      // Success
      setSubmitted(true);
      setFormData({ company: "", phone: "", email: "" });
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(err.message || "Error al enviar el formulario. Por favor, intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255, 54, 33, 0.05), transparent 60%)`
        }}
      />

      <Container className="relative z-10 max-w-4xl">
        <motion.div
          initial={animations.fadeInUp.initial}
          whileInView={animations.fadeInUp.animate}
          viewport={viewport}
          transition={animations.fadeInUp.transition}
          className="text-center"
        >
          <div className="bg-white rounded-3xl border border-gray-200 p-8 lg:p-12 shadow-lg">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-[#FF3621] flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>

            {/* Title & Description */}
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {t.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t.subtitle}
            </p>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {t.features.map((feature: string, index: number) => (
                <FeatureBadge key={index} text={feature} index={index} />
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="group inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-1"
            >
              {t.cta}
              <motion.span
                animate={{ rotate: showForm ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="ml-2"
              >
                {showForm ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </motion.span>
            </button>

            {/* Expandable Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    {submitted ? (
                      <SuccessMessage message={t.form.success} />
                    ) : (
                      <ContactForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        labels={t.form}
                        isSubmitting={isSubmitting}
                        error={error}
                        setError={setError}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Alternative */}
            <p className="mt-6 text-sm text-gray-500">
              {t.emailPrefix}{" "}
              <a
                href={`mailto:${company.email}`}
                className="text-[#FF3621] hover:underline"
              >
                {company.email}
              </a>
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/**
 * Feature badge component
 */
function FeatureBadge({ text, index }: { text: string; index: number }) {
  return (
    <motion.div
      initial={animations.scaleIn.initial}
      whileInView={animations.scaleIn.animate}
      viewport={viewport}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200"
    >
      <div className="w-2 h-2 rounded-full bg-[#FF3621]" />
      <span className="text-sm text-gray-700">{text}</span>
    </motion.div>
  );
}

/**
 * Success message component
 */
function SuccessMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={animations.scaleIn.initial}
      animate={animations.scaleIn.animate}
      className="py-8"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <p className="text-lg text-gray-600">{message}</p>
    </motion.div>
  );
}

/**
 * Contact form component
 */
interface ContactFormProps {
  formData: { company: string; phone: string; email: string };
  setFormData: React.Dispatch<React.SetStateAction<{ company: string; phone: string; email: string }>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  labels: {
    company: string;
    phone: string;
    email: string;
    submit: string;
    placeholders: { company: string; phone: string; email: string };
  };
  isSubmitting: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

function ContactForm({ formData, setFormData, onSubmit, labels, isSubmitting, error, setError }: ContactFormProps) {
  const fields = [
    { 
      name: "company" as const, 
      type: "text", 
      icon: Building2, 
      label: labels.company,
      placeholder: labels.placeholders.company 
    },
    { 
      name: "phone" as const, 
      type: "tel", 
      icon: Phone, 
      label: labels.phone,
      placeholder: labels.placeholders.phone 
    },
    { 
      name: "email" as const, 
      type: "email", 
      icon: Mail, 
      label: labels.email,
      placeholder: labels.placeholders.email 
    },
  ];

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 border border-red-200"
        >
          <p className="text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </motion.div>
      )}

      {fields.map((field) => {
        const Icon = field.icon;
        return (
          <div key={field.name} className="relative group">
            <label className="block text-left text-xs font-medium text-gray-500 mb-1.5 ml-1">
              {field.label}
            </label>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FF3621] transition-colors pointer-events-none z-10" />
              <input
                type={field.type}
                required
                disabled={isSubmitting}
                value={formData[field.name]}
                onChange={(e) => {
                  setFormData({ ...formData, [field.name]: e.target.value });
                  if (error) setError(null);
                }}
                className="w-full pl-12 pr-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#FF3621] focus:ring-2 focus:ring-[#FF3621]/10 transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={field.placeholder}
              />
            </div>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#FF3621] rounded-lg hover:bg-[#FF3621]/90 hover:shadow-lg hover:shadow-[#FF3621]/20 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF3621]"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            {labels.submit}
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
