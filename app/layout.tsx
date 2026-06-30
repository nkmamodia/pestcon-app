import './globals.css';

export const metadata = {
  title: 'Ultimate Service Solutions — Operations App',
  description: 'Manage customers, jobs, invoices and reports in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
