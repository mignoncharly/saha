"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Truck, Send } from "lucide-react";
import { contactSchema, type ContactFormData } from "@/lib/validators";
import { api, parseApiError } from "@/lib/api";
import { PICKUP_CITIES, DELIVERY_CITIES, WHATSAPP_NUMBER } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import FormField from "@/components/ui/FormField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await api.post("/contact/", data);
      toast.success("Message envoyé avec succès. Nous vous répondrons rapidement.");
      reset();
    } catch (err) {
      toast.error(parseApiError(err, "Erreur lors de l'envoi. Veuillez réessayer."));
    }
  };

  return (
    <>
      <PageHeader
        hero
        icon={<Phone className="h-8 w-8" />}
        title="Contactez-nous"
        subtitle="Une question sur votre envoi ? Écrivez-nous ou contactez-nous directement sur WhatsApp."
      />

      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={`tel:${WHATSAPP_NUMBER}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Téléphone</p>
                <p className="text-sm text-gray-500">{WHATSAPP_NUMBER}</p>
              </div>
            </a>
            <a
              href="mailto:info@gestionatech.de"
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Email</p>
                <p className="break-all text-sm text-gray-500">info@gestionatech.de</p>
              </div>
            </a>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              <MapPin className="h-4 w-4 text-brand-gold" /> Zones de ramassage en Europe
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">{PICKUP_CITIES.join(" · ")}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              <Truck className="h-4 w-4 text-brand-gold" /> Destinations au Cameroun
            </h2>
            <p className="text-sm text-gray-600">{DELIVERY_CITIES.join(" · ")}</p>
          </div>

          <WhatsAppCTA className="w-full" />
        </div>

        {/* Contact form */}
        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" noValidate>
            <h2 className="text-xl font-bold text-gray-900">Envoyez un message</h2>
            <FormField label="Nom" htmlFor="name" required error={errors.name?.message}>
              <input id="name" {...register("name")} className={`input ${errors.name ? "input-error" : ""}`} />
            </FormField>
            <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
              <input id="email" type="email" {...register("email")} className={`input ${errors.email ? "input-error" : ""}`} />
            </FormField>
            <FormField label="Message" htmlFor="message" required error={errors.message?.message}>
              <textarea id="message" rows={5} {...register("message")} className={`input ${errors.message ? "input-error" : ""}`} />
            </FormField>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <LoadingSpinner className="h-5 w-5" /> : <><Send className="h-4 w-4" /> Envoyer</>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
