'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  property_type: string | null;
  city: string | null;
  amc_plan: string | null;
  amc_renewal_date: string | null;
};

const emptyForm = {
  full_name: '',
  phone: '',
  email: '',
  address: '',
  property_type: '',
  city: '',
  amc_plan: 'none',
  amc_renewal_date: '',
};

export default function CustomersPage() {
  const supabase = getSupabaseClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('customers').insert([
      {
        ...form,
        amc_renewal_date: form.amc_renewal_date || null,
      },
    ]);
    if (!error) {
      setForm(emptyForm);
      setShowForm(false);
      loadCustomers();
    } else {
      alert(error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    await supabase.from('customers').delete().eq('id', id);
    loadCustomers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4"
        >
          <input
            placeholder="Full Name *"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Phone *"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2 col-span-2"
          />
          <select
            value={form.property_type}
            onChange={(e) => setForm({ ...form, property_type: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="">Property Type</option>
            <option>Apartment / Flat</option>
            <option>Independent House / Villa</option>
            <option>Office / Retail</option>
            <option>Restaurant / Hotel</option>
            <option>Factory / Warehouse</option>
            <option>Hospital / Clinic</option>
            <option>School / Institution</option>
          </select>
          <select
            value={form.amc_plan}
            onChange={(e) => setForm({ ...form, amc_plan: e.target.value })}
            className="border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="none">No AMC</option>
            <option value="residential">Residential AMC</option>
            <option value="commercial">Commercial AMC</option>
            <option value="industrial">Industrial AMC</option>
          </select>
          <div className="col-span-2">
            <label className="text-sm text-slate-500">AMC Renewal Date</label>
            <input
              type="date"
              value={form.amc_renewal_date}
              onChange={(e) => setForm({ ...form, amc_renewal_date: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 w-full mt-1"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700"
          >
            Save Customer
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">AMC</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-4 text-slate-400" colSpan={5}>Loading...</td></tr>
            )}
            {!loading && customers.length === 0 && (
              <tr><td className="px-4 py-4 text-slate-400" colSpan={5}>No customers yet.</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3">
                  <a href={`tel:${c.phone}`} className="text-blue-600">{c.phone}</a>{' '}
                  ·{' '}
                  <a
                    href={`https://wa.me/91${c.phone.replace(/\D/g, '').slice(-10)}`}
                    target="_blank"
                    className="text-emerald-600"
                  >
                    WhatsApp
                  </a>
                </td>
                <td className="px-4 py-3">{c.city || '—'}</td>
                <td className="px-4 py-3 capitalize">{c.amc_plan === 'none' ? '—' : c.amc_plan}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
