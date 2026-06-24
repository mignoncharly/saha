"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, type LucideIcon } from 'lucide-react';
import type { DashboardStats } from '@/types/api';
import { statusLabel } from '@/components/ui/StatusBadge';

const COLORS = ['#0D47A1', '#00C49F', '#F9A825', '#FF8042', '#8884d8', '#ff6361', '#bc5090'];

/** Placeholder shown inside a chart card while there is no data to plot. */
function ChartEmpty({ height, icon: Icon, message }: { height: number; icon: LucideIcon; message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-center text-gray-400"
      style={{ height }}
    >
      <Icon className="h-9 w-9" />
      <p className="text-sm font-medium text-gray-500">{message}</p>
      <p className="text-xs text-gray-400">Les données apparaîtront ici dès les premières demandes.</p>
    </div>
  );
}

export default function AdminCharts({ stats }: { stats: DashboardStats }) {
  const statusData = stats.by_status.map(s => ({ name: statusLabel(s.status), count: s.count }));
  const overTime = stats.requests_over_time || [];
  const cityData = stats.by_pickup_city.map(c => ({ name: c.pickup_city, value: c.count }));

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="card">
        <h3 className="font-semibold mb-4">Demandes par statut</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0D47A1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty height={300} icon={BarChart3} message="Aucune demande pour le moment" />
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Évolution des demandes (30j)</h3>
        {overTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#F9A825" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty height={300} icon={TrendingUp} message="Pas encore d'activité sur 30 jours" />
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Par ville de ramassage</h3>
        {cityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={cityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {cityData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty height={250} icon={PieChartIcon} message="Aucune ville de ramassage" />
        )}
      </div>
    </div>
  );
}
