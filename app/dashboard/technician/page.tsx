'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function TechnicianView() {
  const supabase = getSupabaseClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [report, setReport] = useState({ chemicals_used: '', work_summary: '' });

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('jobs')
      .select('*, customers(full_name, phone, address)')
      .eq('technician_id', user.id)
      .order('scheduled_date', { ascending: true });
    setJobs(data || []);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function markStatus(id: string, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id);
    loadJobs();
  }

  async function submitReport(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('service_reports').insert([
      { job_id: jobId, technician_id: user?.id, ...report },
    ]);
    await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
    setReportFor(null);
    setReport({ chemicals_used: '', work_summary: '' });
    loadJobs();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My Jobs Today</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-medium">{job.service_type}</p>
            <p className="text-sm text-slate-500">{job.customers?.full_name} · {job.customers?.address}</p>
            <p className="text-sm text-slate-500 mb-3">{job.scheduled_date} {job.scheduled_time}</p>

            {job.status !== 'completed' && (
              <div className="flex gap-2 mb-2">
                {job.status === 'scheduled' && (
                  <button onClick={() => markStatus(job.id, 'in_progress')} className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm">
                    Start Job
                  </button>
                )}
                {job.status === 'in_progress' && reportFor !== job.id && (
                  <button onClick={() => setReportFor(job.id)} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm">
                    Mark Complete + File Report
                  </button>
                )}
              </div>
            )}

            {reportFor === job.id && (
              <div className="space-y-2 mt-2 border-t border-slate-100 pt-3">
                <input
                  placeholder="Chemicals used"
                  value={report.chemicals_used}
                  onChange={(e) => setReport({ ...report, chemicals_used: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm"
                />
                <textarea
                  placeholder="Work summary"
                  value={report.work_summary}
                  onChange={(e) => setReport({ ...report, work_summary: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 w-full text-sm"
                />
                <button onClick={() => submitReport(job.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Submit Report
                </button>
              </div>
            )}

            {job.status === 'completed' && (
              <span className="text-emerald-600 text-sm font-medium">✓ Completed</span>
            )}
          </div>
        ))}
        {jobs.length === 0 && <p className="text-slate-400">No jobs assigned to you yet.</p>}
      </div>
    </div>
  );
}
