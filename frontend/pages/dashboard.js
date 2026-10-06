import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession, clearSession } from "../lib/auth";
import {
  getDoctors,
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
} from "../lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Booking form state for PATIENT
  const [bookingDoctorId, setBookingDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState("");

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    setMounted(true);
    setMinDateTime(getMinDateTime());
    const currentSession = getSession();
    if (!currentSession || !currentSession.token) {
      router.push("/login");
      return;
    }
    setSession(currentSession);
    initData(currentSession);
  }, []);

  const initData = async (currentSession) => {
    setLoading(true);
    setError("");
    const { token, user } = currentSession;

    try {
      if (user?.role === "PATIENT") {
        const [docs, apts] = await Promise.all([
          getDoctors(token),
          getAppointments(token),
        ]);
        setDoctors(docs);
        setAppointments(apts);
        if (docs.length > 0) {
          setBookingDoctorId(docs[0].id.toString());
        }
      } else if (user?.role === "DOCTOR") {
        const apts = await getAppointments(token);
        setAppointments(apts);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refreshAppointments = async () => {
    if (!session?.token) return;
    try {
      const apts = await getAppointments(session.token);
      setAppointments(apts);
    } catch (err) {
      setError(err.message || "Failed to refresh appointments");
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDoctorId || !bookingDate) {
      setError("Please select a doctor and date/time");
      return;
    }

    const selectedDate = new Date(bookingDate);
    if (isNaN(selectedDate.getTime())) {
      setError("Invalid appointment date and time");
      return;
    }

    if (selectedDate <= new Date()) {
      setError("Appointment date and time must be in the future.");
      return;
    }

    setBookingLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await bookAppointment(
        {
          doctorId: parseInt(bookingDoctorId, 10),
          appointmentDate: new Date(bookingDate).toISOString(),
        },
        session.token
      );
      setSuccessMsg("Appointment booked successfully!");
      setBookingDate("");
      await refreshAppointments();
    } catch (err) {
      setError(err.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    setError("");
    setSuccessMsg("");
    try {
      await updateAppointmentStatus(appointmentId, newStatus, session.token);
      setSuccessMsg(`Appointment #${appointmentId} status updated to ${newStatus}`);
      await refreshAppointments();
    } catch (err) {
      setError(err.message || "Failed to update appointment status");
    }
  };

  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <div className="dashboard-container">
      {/* Nav Bar */}
      <header className="navbar">
        <div className="navbar-brand">HealthChain</div>
        <div className="navbar-right">
          <span className="navbar-user">{user?.name}</span>
          <span className={getRoleBadgeClass(user?.role)}>
            {user?.role}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && <div className="alert-error">{error}</div>}
        {successMsg && <div className="alert-success">{successMsg}</div>}

        {loading ? (
          <div className="state-loading">Loading dashboard data...</div>
        ) : user?.role === "ADMIN" ? (
          <div className={`dashboard-card fade-in ${mounted ? "is-mounted" : ""}`}>
            <h2 className="section-title">Admin Dashboard</h2>
            <p className="placeholder-text">
              Admin dashboard coming in a later phase
            </p>
          </div>
        ) : (
          <>
            {/* Booking Form for Patient */}
            {user?.role === "PATIENT" && (
              <div className={`dashboard-card fade-in ${mounted ? "is-mounted" : ""}`}>
                <h2 className="section-title">Book an Appointment</h2>
                <form onSubmit={handleBookAppointment} className="booking-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="doctorSelect">
                        Select Doctor
                      </label>
                      <select
                        id="doctorSelect"
                        value={bookingDoctorId}
                        onChange={(e) => setBookingDoctorId(e.target.value)}
                        className="form-select"
                        required
                      >
                        {doctors.length === 0 ? (
                          <option value="">No doctors available</option>
                        ) : (
                          doctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name}{" "}
                              {doc.doctorProfile?.specialization
                                ? `(${doc.doctorProfile.specialization})`
                                : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="appointmentDate">
                        Date &amp; Time
                      </label>
                      <input
                        id="appointmentDate"
                        type="datetime-local"
                        min={minDateTime}
                        onFocus={() => setMinDateTime(getMinDateTime())}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || doctors.length === 0}
                    className="btn-primary btn-book"
                  >
                    {bookingLoading ? "Booking..." : "Book Appointment"}
                  </button>
                </form>
              </div>
            )}

            {/* Appointments List for PATIENT and DOCTOR */}
            <div className={`dashboard-card fade-in ${mounted ? "is-mounted" : ""}`}>
              <div className="section-header">
                <h2 className="section-title">Appointments</h2>
                <button
                  onClick={refreshAppointments}
                  className="btn-secondary"
                >
                  Refresh
                </button>
              </div>

              {appointments.length === 0 ? (
                <p className="state-empty">No appointments found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="appointment-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Doctor</th>
                        <th>Patient</th>
                        <th>Date &amp; Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((apt) => (
                        <tr
                          key={apt.id}
                          className={`table-row-animate ${mounted ? "is-mounted" : ""}`}
                        >
                          <td className="cell-id">#{apt.id}</td>
                          <td>
                            <div className="user-primary">
                              {apt.doctor?.name || "Unknown"}
                            </div>
                            <div className="user-secondary">
                              {apt.doctor?.email || ""}
                            </div>
                          </td>
                          <td>
                            <div className="user-primary">
                              {apt.patient?.name || "Unknown"}
                            </div>
                            <div className="user-secondary">
                              {apt.patient?.email || ""}
                            </div>
                          </td>
                          <td className="date-primary">
                            {new Date(apt.appointmentDate).toLocaleString()}
                          </td>
                          <td>
                            {user?.role === "DOCTOR" ? (
                              <select
                                value={apt.status}
                                onChange={(e) =>
                                  handleStatusChange(apt.id, e.target.value)
                                }
                                className="status-select"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            ) : (
                              <span
                                className={`status-badge ${getStatusBadgeClass(
                                  apt.status
                                )}`}
                              >
                                {apt.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function getRoleBadgeClass(role) {
  if (role === "DOCTOR") return "role-badge role-badge-doctor";
  if (role === "ADMIN") return "role-badge role-badge-admin";
  return "role-badge role-badge-patient";
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "CONFIRMED":
      return "status-confirmed";
    case "COMPLETED":
      return "status-completed";
    case "CANCELLED":
      return "status-cancelled";
    case "PENDING":
    default:
      return "status-pending";
  }
}
