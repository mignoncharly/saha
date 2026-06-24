"use client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminRequestTable from "@/components/admin/AdminRequestTable";
import AdminRequestFilters from "@/components/admin/AdminRequestFilters";
import { useState } from "react";

export default function AdminRequestsPage() {
  const [filters, setFilters] = useState({
    status: [] as string[],
    pickup_city: "",
    service_type: "",
    date_from: "",
    date_to: "",
    search: "",
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminRequestFilters filters={filters} onFilterChange={setFilters} />
        <AdminRequestTable filters={filters} />
      </div>
    </AdminLayout>
  );
}
