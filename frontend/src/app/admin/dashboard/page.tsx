"use client";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ClipboardList, CheckCircle, BarChart3 } from "lucide-react";
import AdminCharts from "@/components/admin/AdminCharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>("/admin/dashboard/").then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner className="h-10 w-10" /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full"><ClipboardList className="h-6 w-6 text-blue-700" /></div>
              <div>
                <p className="text-sm text-gray-500">Total demandes</p>
                <p className="text-2xl font-bold">{stats.total_requests}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full"><BarChart3 className="h-6 w-6 text-yellow-700" /></div>
              <div>
                <p className="text-sm text-gray-500">Nouvelles</p>
                <p className="text-2xl font-bold">{stats.new_requests}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="h-6 w-6 text-green-700" /></div>
              <div>
                <p className="text-sm text-gray-500">Confirmées</p>
                <p className="text-2xl font-bold">{stats.confirmed_requests}</p>
              </div>
            </div>
          </div>
          <AdminCharts stats={stats} />
        </>
      ) : (
        <p className="text-red-500">Impossible de charger les statistiques.</p>
      )}
    </AdminLayout>
  );
}