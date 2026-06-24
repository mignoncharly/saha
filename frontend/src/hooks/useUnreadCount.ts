"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { resolveRole } from "@/lib/navigation";

/**
 * Unread notification count for the logged-in customer (drives navbar badges).
 * Returns 0 for guests/admins and degrades silently on error.
 */
export function useUnreadCount() {
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  const isCustomer = !!user && resolveRole(user.role) === "customer";

  const refresh = useCallback(() => {
    if (!isCustomer) {
      setUnread(0);
      return;
    }
    api
      .get<{ unread: number }>("/notifications/me/unread-count/")
      .then((d) => setUnread(d.unread || 0))
      .catch(() => setUnread(0));
  }, [isCustomer]);

  useEffect(() => {
    if (loading) return;
    refresh();
  }, [loading, refresh]);

  return { unread, refresh };
}
