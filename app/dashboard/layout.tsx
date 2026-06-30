'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/jobs', label: 'Jobs' },
  { href: '/dashboard/invoices', label: 'Invoices' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 font-semibold border-b border-slate-200">USS Ops</div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg"
        >
          Log Out
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
