import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold mb-2">Ultimate Service Solutions</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        Manage customers, jobs, invoices and reports — all in one place.
      </p>
      <Link
        href="/login"
        className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700"
      >
        Log In
      </Link>
    </main>
  );
}
