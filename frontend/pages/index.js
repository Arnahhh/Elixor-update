import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing-page-dark">
      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <Link href="#home" className="landing-brand">
          HealthChain
          <span className="landing-brand-tag">Clinic Platform</span>
        </Link>

        <ul className="landing-nav-links">
          <li>
            <a href="#home" className="landing-nav-link">
              Home
            </a>
          </li>
          <li>
            <a href="#features" className="landing-nav-link">
              Features
            </a>
          </li>
          <li>
            <a href="#why" className="landing-nav-link">
              Why HealthChain
            </a>
          </li>
          <li>
            <a href="#contact" className="landing-nav-link">
              Contact
            </a>
          </li>
        </ul>

        <Link href="/login" className="landing-login-btn">
          Log In
        </Link>
      </nav>

      {/* Hero Section */}
      <header id="home" className={`landing-hero landing-fade-up ${mounted ? "is-mounted" : ""}`}>
        <h1 className="landing-headline">
          Manage Appointments. Secure Records. One Platform.
        </h1>

        <p className="landing-subtext">
          A unified relational database system designed to manage patient appointments, doctor availability schedules, medical records, prescriptions, and clinic billing — with dedicated, secure role-based access for patients, doctors, and clinic administrators.
        </p>

        <div className="landing-cta-group">
          <Link href="/register" className="landing-btn-solid">
            Get Started
          </Link>
          <Link href="/login" className="landing-btn-ghost">
            Log In
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className={`landing-section landing-fade-up ${mounted ? "is-mounted" : ""}`}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Capabilities</div>
          <h2 className="landing-section-title">Built for Modern Clinic Workflows</h2>
        </div>

        <div className="landing-features-grid">
          {/* Card 1: Role-Based Access */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="landing-feature-card-title">Role-Based Access</h3>
            <p className="landing-feature-card-desc">
              Structured permissions and tailored views for Patients, Doctors, and Clinic Administrators with strict boundary enforcement.
            </p>
          </div>

          {/* Card 2: Appointment Booking */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="landing-feature-card-title">Appointment Scheduling</h3>
            <p className="landing-feature-card-desc">
              Book consultations aligned with doctor availability, with real-time lifecycle tracking across Pending, Confirmed, and Completed states.
            </p>
          </div>

          {/* Card 3: JWT-Secured Authentication */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="landing-feature-card-title">JWT-Secured Auth</h3>
            <p className="landing-feature-card-desc">
              Industry-standard bcrypt password hashing combined with stateless cryptographically signed JWTs protecting every request.
            </p>
          </div>

          {/* Card 4: Medical Records Tracking */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="landing-feature-card-title">Medical Records Tracking</h3>
            <p className="landing-feature-card-desc">
              Consolidated visit documentation including diagnosis notes, prescribed medications, and structured patient clinical history.
            </p>
          </div>
        </div>
      </section>

      {/* Why HealthChain Section */}
      <section id="why" className={`landing-section landing-fade-up ${mounted ? "is-mounted" : ""}`}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Architecture</div>
          <h2 className="landing-section-title">Why HealthChain?</h2>
        </div>

        <div className="landing-why-grid">
          <div className="landing-why-card">
            <h3 className="landing-why-title">Relational Integrity</h3>
            <p className="landing-why-text">
              Built on a normalized PostgreSQL schema that links patients, doctors, visits, records, and payments without redundant or conflicting data.
            </p>
          </div>

          <div className="landing-why-card">
            <h3 className="landing-why-title">Coordinated Availability</h3>
            <p className="landing-why-text">
              Doctor weekly availability slots enforce clear scheduling windows, preventing scheduling overlaps and ensuring predictable consultation times.
            </p>
          </div>

          <div className="landing-why-card">
            <h3 className="landing-why-title">Clinic-Grade Security</h3>
            <p className="landing-why-text">
              Strict role-guard middleware ensures doctor records, patient medical histories, and administrative settings remain strictly segregated.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`landing-section landing-fade-up ${mounted ? "is-mounted" : ""}`}>
        <div className="landing-contact-box">
          <h3 className="landing-contact-title">Ready to streamline clinic appointments?</h3>
          <p className="landing-contact-desc">
            HealthChain provides healthcare providers with a reliable, structured platform for appointment coordination and patient record management.
          </p>
          <div className="landing-cta-group">
            <Link href="/register" className="landing-btn-solid">
              Create an Account
            </Link>
            <Link href="/login" className="landing-btn-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-name">HealthChain</div>
        <div className="landing-footer-tag">
          Healthcare Appointment &amp; Records Platform
        </div>
      </footer>
    </div>
  );
}
