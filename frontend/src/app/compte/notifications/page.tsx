"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Settings, CheckCheck, Inbox, ArrowLeft } from "lucide-react";
import { api, parseApiError } from "@/lib/api";
import type { CustomerNotification, NotificationPreference } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";
import { useTranslation } from "@/lib/i18n";

export default function CustomerNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, formatDate } = useTranslation();

  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pref, setPref] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/compte/connexion");
      return;
    }
    Promise.all([
      api.get<{ unread: number; results: CustomerNotification[] }>("/notifications/me/"),
      api.get<NotificationPreference>("/notifications/preferences/"),
    ])
      .then(([list, p]) => {
        setItems(list.results);
        setUnread(list.unread);
        setPref(p);
      })
      .catch(() => toast.error(t("Impossible de charger les notifications.")))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, t]);

  const markAllRead = async () => {
    try {
      await api.post<{ unread: number }>("/notifications/me/read/", {});
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      toast.error(t("Erreur lors de la mise à jour."));
    }
  };

  const savePref = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pref) return;
    setSavingPref(true);
    try {
      const updated = await api.put<NotificationPreference>("/notifications/preferences/", pref);
      setPref(updated);
      toast.success(t("Préférences enregistrées."));
    } catch (err) {
      toast.error(parseApiError(err, t("Erreur lors de l'enregistrement.")));
    } finally {
      setSavingPref(false);
    }
  };

  if (authLoading || !user) return <LoadingState fullPage />;

  return (
    <>
      <section className="bg-gradient-to-br from-brand-blue to-navy-900 text-white">
        <div className="container-page py-10">
          <Link href="/compte" className="mb-3 inline-flex items-center gap-1.5 text-sm text-blue-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("account.mySpace")}
          </Link>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
            <Bell className="h-7 w-7 text-brand-gold" /> {t("Notifications")}
          </h1>
          <p className="mt-1 text-sm text-blue-100">{t("Gérez vos alertes et consultez votre historique.")}</p>
        </div>
      </section>

      <div className="container-page max-w-3xl space-y-8 py-10">
        {loading ? (
          <LoadingState label={t("Chargement…")} />
        ) : (
          <>
            {/* Preferences */}
            {pref && (
              <section className="card">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Settings className="h-5 w-5 text-brand-blue" /> {t("Préférences")}
                </h2>
                <form onSubmit={savePref} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={t("Langue des notifications")} htmlFor="pref-lang">
                      <select
                        id="pref-lang"
                        value={pref.language}
                        onChange={(e) => setPref({ ...pref, language: e.target.value })}
                        className="input"
                      >
                        <option value="fr">{t("Français")}</option>
                        <option value="de">{t("Allemand")}</option>
                      </select>
                    </FormField>
                    <FormField label={t("Régions de ramassage suivies")} htmlFor="pref-regions" hint={t("Séparez par des virgules.")}>
                      <input
                        id="pref-regions"
                        value={pref.regions}
                        onChange={(e) => setPref({ ...pref, regions: e.target.value })}
                        placeholder={t("ex: Frankfurt, Strasbourg")}
                        className="input"
                      />
                    </FormField>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={pref.status_updates}
                      onChange={(e) => setPref({ ...pref, status_updates: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    {t("Recevoir les mises à jour de statut de mes demandes")}
                  </label>
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={pref.pickup_alerts}
                      onChange={(e) => setPref({ ...pref, pickup_alerts: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    {t("Recevoir les alertes de ramassage et de chargement")}
                  </label>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button type="submit" disabled={savingPref} className="btn-primary">
                      {savingPref ? t("Enregistrement…") : t("Enregistrer les préférences")}
                    </button>
                    <NotificationPermissionButton />
                  </div>
                </form>
              </section>
            )}

            {/* History */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("Historique")} {unread > 0 && <span className="ml-1 align-middle badge bg-brand-red text-white">{t("{count} non lues", { count: unread })}</span>}
                </h2>
                {unread > 0 && (
                  <button onClick={markAllRead} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline">
                    <CheckCheck className="h-4 w-4" /> {t("Tout marquer comme lu")}
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="h-7 w-7" />}
                  title={t("Aucune notification")}
                  description={t("Vous verrez ici les mises à jour de vos demandes et les alertes de ramassage.")}
                />
              ) : (
                <ul className="space-y-3">
                  {items.map((n) => {
                    const inner = (
                      <div className={`rounded-2xl border p-4 shadow-card transition-colors ${n.read ? "border-gray-100 bg-white" : "border-brand-blue/20 bg-brand-blue/5"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold text-gray-900">
                              {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" aria-label={t("Non lue")} />}
                              {n.title}
                            </p>
                            {n.body && <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>}
                          </div>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.reference_code ? (
                          <Link href={`/suivi?ref=${n.reference_code}`}>{inner}</Link>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
