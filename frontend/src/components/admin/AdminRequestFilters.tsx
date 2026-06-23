"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";
import { Search } from "lucide-react";

interface Filters {
  status: string[];
  pickup_city: string;
  service_type: string;
  date_from: string;
  date_to: string;
  search: string;
}

interface Props {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export default function AdminRequestFilters({ filters, onFilterChange }: Props) {
  const [services, setServices] = useState<ServiceType[]>([]);
  const statusOptions = [
    { value: "new", label: "Nouveau" },
    { value: "contacted", label: "Contacté" },
    { value: "confirmed", label: "Confirmé" },
    { value: "pickup_scheduled", label: "Ramassage planifié" },
    { value: "received", label: "Reçu" },
    { value: "loaded", label: "Chargé" },
    { value: "in_transit", label: "En route" },
    { value: "arrived_cameroon", label: "Arrivé au Cameroun" },
    { value: "delivered", label: "Livré" },
    { value: "cancelled", label: "Annulé" },
  ];

  useEffect(() => {
    api.get<ServiceType[]>("/admin/services/").then(setServices).catch(console.error);
  }, []);

  const toggleStatus = (value: string) => {
    const newStatus = filters.status.includes(value)
      ? filters.status.filter(s => s !== value)
      : [...filters.status, value];
    onFilterChange({ ...filters, status: newStatus });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-auto flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Réf, client..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-8 pr-3 py-2 border rounded-lg w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type de service</label>
          <select
            value={filters.service_type}
            onChange={(e) => onFilterChange({ ...filters, service_type: e.target.value })}
            className="border rounded-lg py-2 px-3 text-sm"
          >
            <option value="">Tous</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ville de ramassage</label>
          <input
            type="text"
            value={filters.pickup_city}
            onChange={(e) => onFilterChange({ ...filters, pickup_city: e.target.value })}
            placeholder="ex: Frankfurt"
            className="border rounded-lg py-2 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
            className="border rounded-lg py-2 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })}
            className="border rounded-lg py-2 px-3 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Statuts</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleStatus(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                filters.status.includes(opt.value)
                  ? "bg-brand-blue text-white border-brand-blue"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}