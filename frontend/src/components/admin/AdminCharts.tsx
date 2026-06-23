"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { DashboardStats } from '@/types/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6361', '#bc5090'];

export default function AdminCharts({ stats }: { stats: DashboardStats }) {
  const statusData = stats.by_status.map(s => ({ name: s.status, count: s.count }));
  const overTime = stats.requests_over_time || [];
  const cityData = stats.by_pickup_city.map(c => ({ name: c.pickup_city, value: c.count }));

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="card">
        <h3 className="font-semibold mb-4">Demandes par statut</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0D47A1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Évolution des demandes (30j)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#F9A825" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-4">Par ville de ramassage</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={cityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {cityData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}