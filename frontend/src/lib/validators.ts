import { z } from "zod";

export const transportRequestSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  phone: z.string().min(6, "Téléphone requis"),
  whatsapp_number: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  service_type_id: z.coerce.number({ required_error: "Type de service requis" }).min(1, "Sélectionnez un service"),
  pickup_city: z.string().min(2, "Ville de ramassage requise"),
  pickup_address: z.string().min(5, "Adresse requise"),
  preferred_pickup_date: z.string().optional(),
  destination_city_id: z.coerce.number({ required_error: "Destination requise" }).min(1, "Sélectionnez une destination"),
  quantity: z.coerce.number().min(1).default(1),
  dimensions: z.string().optional(),
  estimated_weight: z.string().optional(),
  description: z.string().optional(),
  customer_notes: z.string().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter d'être contacté" }) }),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  message: z.string().min(10, "Message trop court (min 10 caractères)"),
});

export type TransportRequestFormData = z.infer<typeof transportRequestSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;