"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getUser, clearAuth, MedicationItem } from "../../lib/api";

interface PrescriptionRecord {
  id: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id: string;
  medications: MedicationItem[];
  notes?: string;
  issued_at: string;
  blockchain_transactions?: {
    tx_hash: string;
    status: string;
    block_number?: number;
  }[];
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    const authed = getUser();
    if (authed) setUser(authed);

    api.getAppointments().then(setAppointments).catch(console.error);
    api.getReports().then(setReports).catch(console.error);
    api.getPrescriptions().then(setPrescriptions).catch(console.error);
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadMessage(null);
    const form = new FormData(e.currentTarget);
    try {
      await api.uploadReport(form);
      setReports(await api.getReports());
      setUploadMessage("Report successfully uploaded, analyzed, and anchored on Sepolia!");
      e.currentTarget.reset();
    } catch (err: any) {
      console.error(err);
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              Verified Patient
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {user?.wallet_address ? `Wallet: ${user.wallet_address}` : "Authenticated via Ethereum Wallet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => clearAuth()}
            className="text-xs text-slate-600 hover:text-red-600 px-3 py-1.5 rounded border border-slate-300 hover:border-red-300 transition"
          >
            Disconnect
          </Link>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white shadow-sm">
          {appointments.map((a) => (
            <li key={a.appointment_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
              <div>
                <span className="font-semibold text-slate-900">{a.doctor_name}</span>
                <span className="text-slate-500 ml-2">({a.specialization})</span>
              </div>
              <span className="text-slate-500 text-xs">
                {new Date(a.scheduled_at).toLocaleString()} · <span className="capitalize">{a.appointment_status}</span>
              </span>
            </li>
          ))}
          {appointments.length === 0 && <li className="p-4 text-slate-400 text-sm">No upcoming appointments.</li>}
        </ul>
      </section>

      {/* My Prescriptions Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>💊 My Prescriptions</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Blockchain Verified
            </span>
          </h2>
          <span className="text-xs text-slate-500">{prescriptions.length} record(s)</span>
        </div>

        <div className="space-y-3">
          {prescriptions.map((p) => {
            const txHash = p.blockchain_transactions?.[0]?.tx_hash;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    Prescribed on: <span className="font-semibold text-slate-800">{new Date(p.issued_at).toLocaleDateString()}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {p.id.slice(0, 13)}...
                  </span>
                </div>

                {/* Medications List */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Prescribed Medications:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(p.medications) ? (
                      p.medications.map((m, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs"
                        >
                          <span className="font-bold text-indigo-950">{m.name}</span>
                          <span className="text-slate-600 ml-1 font-medium">({m.dosage})</span>
                          <span className="text-indigo-700 ml-1.5">· {m.frequency}</span>
                          <span className="text-slate-500 ml-1.5">[{m.duration_days} days]</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No medication data</span>
                    )}
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-800">Doctor Instructions: </span>
                    {p.notes}
                  </p>
                )}

                {/* Audit & On-Chain Status */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>Sepolia Blockchain Anchored</span>
                  </span>
                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 hover:underline truncate max-w-xs"
                    >
                      tx: {txHash}
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {prescriptions.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              No prescriptions issued to you yet.
            </div>
          )}
        </div>
      </section>

      {/* Medical Reports & AI Analysis */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Medical Reports & AI Analysis</h2>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white shadow-sm">
          {reports.map((r) => (
            <li key={r.report_id} className="p-4 text-sm space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-900">{r.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                    r.blockchain_status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {r.blockchain_status ?? "not anchored"}
                </span>
              </div>
              {r.summary && <p className="text-slate-600 text-xs mt-1 leading-relaxed">{r.summary}</p>}
              {r.tx_hash && (
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  tx: {r.tx_hash}
                </p>
              )}
            </li>
          ))}
          {reports.length === 0 && <li className="p-4 text-slate-400 text-sm">No reports uploaded yet.</li>}
        </ul>
      </section>

      {/* Upload a New Report */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Upload a New Report</h2>
        <form onSubmit={handleUpload} className="space-y-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <input type="hidden" name="patient_id" value={user?.id || ""} />
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
            <input
              name="title"
              placeholder="e.g. Comprehensive Blood Test / Lipid Panel"
              required
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Category</label>
            <select name="report_type" className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="lab_result">Lab Result</option>
              <option value="imaging">Imaging</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="consultation_note">Consultation Note</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Extracted Report Text (For RAG AI Contextual Analysis)
            </label>
            <textarea
              name="raw_text"
              placeholder="Paste lab values or report text here (e.g. 'Cholesterol: 210 mg/dL, HDL: 45, LDL: 140, Triglycerides: 175')"
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document File</label>
            <input
              type="file"
              name="file"
              required
              className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {uploadMessage && (
            <p className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
              {uploadMessage}
            </p>
          )}

          <div className="pt-1">
            <button
              disabled={uploading}
              className="rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-medium disabled:opacity-50 hover:bg-indigo-700 shadow-sm transition flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Uploading, Analyzing & Anchoring...</span>
                </>
              ) : (
                <>
                  <span>Upload & Analyze</span>
                  <span>🧠</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
