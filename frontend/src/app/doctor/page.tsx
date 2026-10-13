"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api, getUser, clearAuth, MedicationItem } from "../../lib/api";

interface AppointmentItem {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  scheduled_at: string;
  status: string;
  patient_report_count: number;
}

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

export default function DoctorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Prescription Form State
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [medications, setMedications] = useState<MedicationItem[]>([
    { name: "", dosage: "", frequency: "", duration_days: 7 },
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const authed = getUser();
    if (authed) setUser(authed);

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, presc] = await Promise.allSettled([
        api.getAppointments(),
        api.getPrescriptions(),
      ]);

      if (appts.status === "fulfilled") setAppointments(appts.value);
      if (presc.status === "fulfilled") setPrescriptions(presc.value);
    } catch (err) {
      console.error("Error loading doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration_days: 7 },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length <= 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof MedicationItem, value: any) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleStartPrescription = (appt: AppointmentItem) => {
    setSelectedPatientId(appt.patient_id);
    setSelectedAppointmentId(appt.appointment_id);
    setSubmitSuccess(null);
    setErrorMessage(null);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitSuccess(null);

    if (!selectedPatientId) {
      setErrorMessage("Please select or enter a Patient ID.");
      return;
    }

    // Validate medications
    const validMeds = medications.filter(
      (m) => m.name.trim() && m.dosage.trim() && m.frequency.trim() && m.duration_days > 0
    );

    if (validMeds.length === 0) {
      setErrorMessage("Please fill in at least one medication with name, dosage, frequency, and duration.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPrescription({
        patient_id: selectedPatientId,
        appointment_id: selectedAppointmentId || undefined,
        medications: validMeds,
        notes: notes.trim() || undefined,
      });

      setSubmitSuccess(res);
      // Reset form
      setMedications([{ name: "", dosage: "", frequency: "", duration_days: 7 }]);
      setNotes("");
      setSelectedAppointmentId("");
      // Reload prescriptions list
      const refreshedPrescriptions = await api.getPrescriptions().catch(() => []);
      setPrescriptions(refreshedPrescriptions);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  // Unique patient list from appointments for dropdown
  const uniquePatients = Array.from(
    new Map(
      appointments.map((a) => [a.patient_id, { id: a.patient_id, name: a.patient_name }])
    ).values()
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Doctor Portal</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Verified Doctor
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

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Upcoming Appointments</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Prescriptions Issued</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{prescriptions.length}</p>
        </div>
      </div>

      {/* Appointments & Patient List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">My Patients & Appointments</h2>
          <span className="text-xs text-slate-500">{appointments.length} scheduled</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {appointments.map((a) => (
            <div
              key={a.appointment_id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{a.patient_name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled: {new Date(a.scheduled_at).toLocaleString()} · {a.patient_report_count} report(s) on file
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Patient ID: {a.patient_id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartPrescription(a)}
                className="self-start sm:self-auto text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1.5"
              >
                <span>💊 Write Prescription</span>
              </button>
            </div>
          ))}

          {appointments.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No appointments found for your doctor account.
            </div>
          )}
        </div>
      </section>

      {/* Write Prescription Form (Blockchain Anchored) */}
      <section ref={formRef} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span>💊 Issue & Anchor Prescription</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                Ethereum Sepolia
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Medication records are securely saved to PostgreSQL and cryptographically anchored (SHA-256) on-chain.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitPrescription} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          {/* Patient Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Patient <span className="text-red-500">*</span>
              </label>
              {uniquePatients.length > 0 ? (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Choose a Patient --</option>
                  {uniquePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Patient UUID"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Reference (Optional)
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- No specific appointment --</option>
                {appointments
                  .filter((a) => !selectedPatientId || a.patient_id === selectedPatientId)
                  .map((a) => (
                    <option key={a.appointment_id} value={a.appointment_id}>
                      {a.patient_name} · {new Date(a.scheduled_at).toLocaleDateString()}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Dynamic Medication Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Prescribed Medications <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
              >
                + Add Medication
              </button>
            </div>

            <div className="space-y-2.5">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg items-end"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Medicine Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin"
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Twice daily"
                      value={med.frequency}
                      onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Days</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={med.duration_days}
                      onChange={(e) => handleMedChange(idx, "duration_days", parseInt(e.target.value) || 1)}
                      required
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-1">
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-red-500 hover:text-red-700 text-xs p-1"
                        title="Remove medication"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions & Clinical Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Take with warm water after meals. Complete the entire 7-day course. Schedule follow-up if symptoms persist."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Success Message & Blockchain Feedback */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <span>✅ Prescription Issued & Anchored!</span>
              </div>
              <p>Prescription ID: <span className="font-mono">{submitSuccess.prescription?.id}</span></p>
              {submitSuccess.blockchain?.tx_hash && (
                <div className="bg-white/80 p-2 rounded border border-emerald-300 font-mono text-[11px] break-all">
                  <span>Sepolia Tx Hash: </span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${submitSuccess.blockchain.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {submitSuccess.blockchain.tx_hash}
                  </a>
                </div>
              )}
              {submitSuccess.blockchain?.error && (
                <p className="text-amber-700">
                  Note: Stored off-chain, on-chain anchoring returned: {submitSuccess.blockchain.error}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Hashing & Anchoring On-Chain...</span>
                </>
              ) : (
                <>
                  <span>Sign & Anchor Prescription</span>
                  <span>⛓️</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Issued Prescriptions History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recently Issued Prescriptions</h2>
          <span className="text-xs text-slate-500">{prescriptions.length} on file</span>
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
                  <div>
                    <span className="font-semibold text-slate-800">Patient: </span>
                    <span className="font-mono text-slate-600">{p.patient_id}</span>
                  </div>
                  <span className="text-slate-400">
                    Issued: {new Date(p.issued_at).toLocaleString()}
                  </span>
                </div>

                {/* Medication Chips */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Prescribed Items:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(p.medications) ? (
                      p.medications.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <span className="font-semibold text-slate-900">{m.name}</span>
                          <span className="text-slate-500 ml-1">({m.dosage})</span>
                          <span className="text-indigo-600 font-medium ml-1.5">· {m.frequency}</span>
                          <span className="text-slate-400 ml-1.5">[{m.duration_days} days]</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No medication data</span>
                    )}
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-medium">Instructions: </span>
                    {p.notes}
                  </p>
                )}

                {/* Blockchain Seal */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>Blockchain Audited</span>
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

          {prescriptions.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              No prescriptions issued yet. Use the form above to prescribe and anchor records.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
