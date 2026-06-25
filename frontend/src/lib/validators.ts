import { z } from "zod";
import type { Translate } from "@/lib/i18n-config";

export function createTransportRequestSchema(t: Translate) {
  return z.object({
    full_name: z.string().min(2, t("Nom requis")),
    phone: z.string().min(6, t("Téléphone requis")),
    whatsapp_number: z.string().optional(),
    email: z.string().email(t("Email invalide")).optional().or(z.literal("")),
    service_type_id: z.coerce.number({ required_error: t("Type de service requis") }).min(1, t("Sélectionnez un service")),
    pickup_city: z.string().min(2, t("Ville de ramassage requise")),
    pickup_address: z.string().min(5, t("Adresse requise")),
    preferred_pickup_date: z.string().optional(),
    destination_city_id: z.coerce.number({ required_error: t("Destination requise") }).min(1, t("Sélectionnez une destination")),
    quantity: z.coerce.number().min(1).default(1),
    dimensions: z.string().optional(),
    estimated_weight: z.string().optional(),
    description: z.string().optional(),
    customer_notes: z.string().optional(),
    consent: z.literal(true, { errorMap: () => ({ message: t("Vous devez accepter d'être contacté") }) }),
  });
}

export function createContactSchema(t: Translate) {
  return z.object({
    name: z.string().min(2, t("Nom requis")),
    email: z.string().email(t("Email invalide")),
    message: z.string().min(10, t("Message trop court (min 10 caractères)")),
  });
}

export type TransportRequestFormData = z.infer<ReturnType<typeof createTransportRequestSchema>>;
export type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;
