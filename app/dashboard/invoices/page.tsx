'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Invoice = {
  id: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string | null;
  customers: { full_name: string; phone: string } | null;
};

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function InvoicesPage() {
  const supabase = getSupabaseClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<{ id: string; full_name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: '', amount: '', due_date: '', notes: '' });

  async function loadAll() {
    const [{ data: invData }, { data: custData }] = await Promise.all([
      supabase.from('invoices').select('*, customers(full_name, phone)').order('issued_date', { ascending: false }),
      supabase.from('customers').select('id, full_name'),
    ]);
    setInvoices((invData as any) || []);
    setCustomers(custData || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('invoices').insert([
      { ...form, amount: parseFloat(form.amount), status: 'draft' },
    ]);
    if (!error) {
      setShowForm(false);
      setForm({ customer_id: '', amount: '', due_date: '', notes: '' });
      loadAll();
    } else {
      alert(error.message);
    }
  }

  async function updateStatus(id: string, status: string) {
    const update: any = { status };
    if (status === 'paid') update.paid_date = new Date().toISOString().slice(0, 10);
    await supabase.from('invoices').update(update).eq('id', id);
    loadAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <button onClick={() => setShowForm((s) => !s)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          {showForm ? 'Cancel' : '+ New Invoice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 col-span-2">
            <option value="">Select Customer *</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <input required type="number" step="0.01" placeholder="Amount (₹) *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 col-span-2" />
          <button type="submit" className="col-span-2 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700">Create Invoice</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{inv.customers?.full_name}</td>
                <td className="px-4 py-3">₹{inv.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">{inv.due_date || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={inv.status}
                    onChange={(e) => updateStatus(inv.id, e.target.value)}
                    className={`rounded-lg px-2 py-1 text-sm font-medium ${statusColors[inv.status]}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td className="px-4 py-4 text-slate-400" colSpan={4}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
