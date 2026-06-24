"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";
import { Search, X } from "lucide-react";
import { statusLabel } from "@/components/ui/StatusBadge";

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

const STATUS_VALUES = [
  "new",
  "contacted",
  "confirmed",
  "pickup_scheduled",
  "received",
  "loaded",
  "in_transit",
  "arrived_cameroon",
  "delivered",
  "cancelled",
];

const EMPTY: Filters = { status: [], pickup_city: "", service_type: "", date_from: "", date_to: "", search: "" };

export default function AdminRequestFilters({ filters, onFilterChange }: Props) {
  const [services, setServices] = useState<ServiceType[]>([]);

  useEffect(() => {
    api.get<ServiceType[]>("/admin/services/").then(setServices).catch(console.error);
  }, []);

  const toggleStatus = (value: string) => {
    const next = filters.status.includes(value)
      ? filters.status.filter((s) => s !== value)
      : [...filters.status, value];
    onFilterChange({ ...filters, status: next });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.pickup_city ||
    filters.service_type ||
    filters.date_from ||
    filters.date_to ||
    filters.search;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="f-search">Recherche</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="f-search"
              type="text"
              placeholder="Réf, client…"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="input pl-9"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="f-service">Type de service</label>
          <select id="f-service" value={filters.service_type} onChange={(e) => onFilterChange({ ...filters, service_type: e.target.value })} className="input">
            <option value="">Tous</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-city">Ville de ramassage</label>
          <input id="f-city" type="text" value={filters.pickup_city} onChange={(e) => onFilterChange({ ...filters, pickup_city: e.target.value })} placeholder="ex: Frankfurt" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="f-from">Du</label>
          <input id="f-from" type="date" value={filters.date_from} onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="f-to">Au</label>
          <input id="f-to" type="date" value={filters.date_to} onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })} className="input" />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Statuts</span>
          {hasActiveFilters && (
            <button onClick={() => onFilterChange(EMPTY)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline">
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_VALUES.map((value) => {
            const active = filters.status.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleStatus(value)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? "border-brand-blue bg-brand-blue text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {statusLabel(value)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
