'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function DashboardOverview() {
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState({
    customers: 0,
    jobsToday: 0,
    pendingInvoices: 0,
    amcDueSoon: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const today = new Date().toISOString().slice(0, 10);
      const in30days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const [{ count: customerCount }, { count: jobsTodayCount }, { count: invoiceCount }, { count: amcCount }] =
        await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('scheduled_date', today),
          supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent', 'overdue']),
          supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('amc_renewal_date', today)
            .lte('amc_renewal_date', in30days),
        ]);

      setStats({
        customers: customerCount || 0,
        jobsToday: jobsTodayCount || 0,
        pendingInvoices: invoiceCount || 0,
        amcDueSoon: amcCount || 0,
      });
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Customers', value: stats.customers },
    { label: "Jobs Today", value: stats.jobsToday },
    { label: 'Pending Invoices', value: stats.pendingInvoices },
    { label: 'AMC Renewals (30 days)', value: stats.amcDueSoon },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-semibold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
