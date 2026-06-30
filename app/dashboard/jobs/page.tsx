'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Job = {
  id: string;
  service_type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  technician_id: string | null;
  customer_id: string;
  customers: { full_name: string; phone: string } | null;
  profiles: { full_name: string } | null;
};

type Option = { id: string; label: string };

const statusColors: Record<string, string> = {
  requested: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function JobsPage() {
  const supabase = getSupabaseClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [technicians, setTechnicians] = useState<Option[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    technician_id: '',
    service_type: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });

  async function loadAll() {
    const [{ data: jobData }, { data: custData }, { data: techData }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, customers(full_name, phone), profiles!jobs_technician_id_fkey(full_name)')
        .order('scheduled_date', { ascending: true }),
      supabase.from('customers').select('id, full_name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'technician'),
    ]);
    setJobs((jobData as any) || []);
    setCustomers((custData || []).map((c: any) => ({ id: c.id, label: c.full_name })));
    setTechnicians((techData || []).map((t: any) => ({ id: t.id, label: t.full_name })));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('jobs').insert([
      {
        ...form,
        technician_id: form.technician_id || null,
        status: form.technician_id ? 'scheduled' : 'requested',
      },
    ]);
    if (!error) {
      setShowForm(false);
      setForm({ customer_id: '', technician_id: '', service_type: '', scheduled_date: '', scheduled_time: '', notes: '' });
      loadAll();
    } else {
      alert(error.message);
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id);
    loadAll();
  }

  async function assignTechnician(id: string, technician_id: string) {
    await supabase
      .from('jobs')
      .update({ technician_id: technician_id || null, status: technician_id ? 'scheduled' : 'requested' })
      .eq('id', id);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          {showForm ? 'Cancel' : '+ Schedule Job'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Select Customer *</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={form.technician_id} onChange={(e) => setForm({ ...form, technician_id: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Assign Technician (optional)</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input required placeholder="Service Type (e.g. Termite Treatment) *" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 col-span-2" />
          <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 col-span-2" />
          <button type="submit" className="col-span-2 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700">Save Job</button>
        </form>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium">{job.service_type}</p>
              <p className="text-sm text-slate-500">
                {job.customers?.full_name} · {job.scheduled_date || 'unscheduled'} {job.scheduled_time || ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={job.technician_id || ''}
                onChange={(e) => assignTechnician(job.id, e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select
                value={job.status}
                onChange={(e) => updateStatus(job.id, e.target.value)}
                className={`rounded-lg px-2 py-1 text-sm font-medium ${statusColors[job.status]}`}
              >
                <option value="requested">Requested</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-slate-400">No jobs yet.</p>}
      </div>
    </div>
  );
}
