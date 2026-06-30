'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function CustomerPortal() {
  const supabase = getSupabaseClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!customer) return;

      const [{ data: jobData }, { data: invData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('customer_id', customer.id).order('scheduled_date', { ascending: false }),
        supabase.from('invoices').select('*').eq('customer_id', customer.id).order('issued_date', { ascending: false }),
      ]);
      setJobs(jobData || []);
      setInvoices(invData || []);
    }
    load();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">My Service History</h1>
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="font-medium">{j.service_type}</p>
              <p className="text-sm text-slate-500">{j.scheduled_date || 'unscheduled'} · {j.status}</p>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-slate-400">No service history yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My Invoices</h2>
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between">
              <span>₹{inv.amount}</span>
              <span className="capitalize text-sm text-slate-500">{inv.status}</span>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-slate-400">No invoices yet.</p>}
        </div>
      </div>
    </div>
  );
}
