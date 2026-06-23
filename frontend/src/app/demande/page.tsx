"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { transportRequestSchema, type TransportRequestFormData } from "@/lib/validators";
import { api } from "@/lib/api";
import type { ServiceType, DestinationCity } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DemandePage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [destinations, setDestinations] = useState<DestinationCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ServiceType[]>("/services/").then(setServices).catch(console.error);
    api.get<DestinationCity[]>("/destination-cities/").then(setDestinations).catch(console.error);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<TransportRequestFormData>({
    resolver: zodResolver(transportRequestSchema),
    defaultValues: {
      quantity: 1,
      consent: false as any,
    },
  });

  const onSubmit = async (data: TransportRequestFormData) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    // Map frontend field names to the API serializer field names.
    const fieldNameMap: Partial<Record<keyof TransportRequestFormData, string>> = {
      service_type_id: "service_type",
      destination_city_id: "destination_city",
    };
    (Object.keys(data) as Array<keyof TransportRequestFormData>).forEach((key) => {
      const apiKey = fieldNameMap[key] ?? key;
      if (key === "consent") {
        formData.append(apiKey, data[key] ? "true" : "false");
      } else if (data[key] !== undefined && data[key] !== "") {
        formData.append(apiKey, String(data[key]));
      }
    });
    // Append files
    const fileInput = document.querySelector<HTMLInputElement>("#photos-upload");
    if (fileInput && fileInput.files) {
      Array.from(fileInput.files).forEach((file) => {
        formData.append("photos", file);
      });
    }

    try {
      const res = await api.postFormData<any>("/transport-requests/", formData);
      router.push(`/demande/confirmation?ref=${res.reference_code}&pickup=${encodeURIComponent(data.pickup_city)}&destination=${encodeURIComponent(destinations.find(d => d.id === data.destination_city_id)?.name || "")}`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la soumission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Demander un ramassage</h1>
      <p className="text-gray-600 mb-8">Remplissez le formulaire ci-dessous et nous vous contacterons rapidement.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* Customer info */}
        <fieldset className="card">
          <legend className="text-xl font-bold mb-4">Vos informations</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom complet *</label>
              <input {...register("full_name")} className="w-full rounded-lg border border-gray-300 p-2.5" />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone / WhatsApp *</label>
              <input {...register("phone")} className="w-full rounded-lg border border-gray-300 p-2.5" />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" {...register("email")} className="w-full rounded-lg border border-gray-300 p-2.5" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp (si différent)</label>
              <input {...register("whatsapp_number")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            </div>
          </div>
        </fieldset>

        {/* Goods info */}
        <fieldset className="card">
          <legend className="text-xl font-bold mb-4">Type de marchandise</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de service *</label>
              <select {...register("service_type_id")} className="w-full rounded-lg border border-gray-300 p-2.5">
                <option value="">Sélectionnez...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.service_type_id && <p className="text-red-500 text-sm mt-1">{errors.service_type_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input type="number" {...register("quantity")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dimensions (approx.)</label>
              <input {...register("dimensions")} placeholder="ex: 50x30x20 cm" className="w-full rounded-lg border border-gray-300 p-2.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Poids estimé (kg)</label>
              <input {...register("estimated_weight")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Description supplémentaire</label>
            <textarea {...register("description")} rows={3} className="w-full rounded-lg border border-gray-300 p-2.5" />
          </div>
        </fieldset>

        {/* Pickup & destination */}
        <fieldset className="card">
          <legend className="text-xl font-bold mb-4">Ramassage et livraison</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ville de ramassage *</label>
              <input {...register("pickup_city")} placeholder="ex: Frankfurt, Strasbourg..." className="w-full rounded-lg border border-gray-300 p-2.5" />
              {errors.pickup_city && <p className="text-red-500 text-sm mt-1">{errors.pickup_city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination *</label>
              <select {...register("destination_city_id")} className="w-full rounded-lg border border-gray-300 p-2.5">
                <option value="">Sélectionnez...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.destination_city_id && <p className="text-red-500 text-sm mt-1">{errors.destination_city_id.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Adresse de ramassage *</label>
              <textarea {...register("pickup_address")} rows={2} className="w-full rounded-lg border border-gray-300 p-2.5" />
              {errors.pickup_address && <p className="text-red-500 text-sm mt-1">{errors.pickup_address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de ramassage souhaitée</label>
              <input type="date" {...register("preferred_pickup_date")} className="w-full rounded-lg border border-gray-300 p-2.5" />
            </div>
          </div>
        </fieldset>

        {/* Photos */}
        <fieldset className="card">
          <legend className="text-xl font-bold mb-4">Photos (optionnel)</legend>
          <input
            id="photos-upload"
            type="file"
            multiple
            accept="image/*"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20"
          />
          <p className="text-xs text-gray-400 mt-1">Vous pouvez joindre plusieurs photos. Formats acceptés : JPG, PNG, WEBP.</p>
        </fieldset>

        {/* Notes & consent */}
        <fieldset className="card">
          <div>
            <label className="block text-sm font-medium mb-1">Remarques supplémentaires</label>
            <textarea {...register("customer_notes")} rows={2} className="w-full rounded-lg border border-gray-300 p-2.5" />
          </div>
          <div className="mt-4 flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              {...register("consent")}
              className="mt-1 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            />
            <label htmlFor="consent" className="text-sm text-gray-600">
              J&apos;accepte d&apos;être contacté par téléphone ou WhatsApp concernant cette demande. *
            </label>
          </div>
          {errors.consent && <p className="text-red-500 text-sm mt-1">{errors.consent.message}</p>}
        </fieldset>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

        <button type="submit" disabled={isSubmitting || loading} className="btn-primary w-full text-lg py-4">
          {isSubmitting || loading ? <LoadingSpinner className="h-6 w-6" /> : "Envoyer la demande"}
        </button>
      </form>
    </div>
  );
}