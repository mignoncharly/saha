"use client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminRequestDetail from "@/components/admin/AdminRequestDetail";
import { useParams } from "next/navigation";

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  return (
    <AdminLayout>
      <AdminRequestDetail id={id} />
    </AdminLayout>
  );
}