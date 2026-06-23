"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/lib/validators";
import { api } from "@/lib/api";
import { Phone, Mail, MapPin } from "lucide-react";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setError(null);
    try {
      await api.post("/contact/", data);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="text-3xl font-bold mb-4">Contactez-nous</h1>
        <p className="text-gray-600 mb-8">Une question ? Utilisez le formulaire ou contactez-nous directement.</p>
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-brand-gold" />
            <span>+49 123 456 7890</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-gold" />
            <span>contact@sahatransport.com</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-brand-gold" />
            <span>Europe & Cameroun</span>
          </div>
        </div>
        <WhatsAppCTA />
      </div>

      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <h2 className="text-xl font-bold">Envoyez un message</h2>
          {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">Message envoyé avec succès !</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input {...register("name")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" {...register("email")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message *</label>
            <textarea {...register("message")} rows={4} className="w-full rounded-lg border border-gray-300 p-2.5" />
            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}