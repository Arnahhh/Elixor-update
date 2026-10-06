# Relational Schema

This document describes the eight entities for HealthChain. Types follow PostgreSQL. Primary keys use `SERIAL` (`INTEGER`, auto-increment). Enumerated columns use PostgreSQL `ENUM` types.

**ENUM types**

- `UserRole`: `PATIENT`, `DOCTOR`, `ADMIN`
- `AppointmentStatus`: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `PAID`, `FAILED`, `REFUNDED`

---

## 1. User

Stores every account in a single table. Access is distinguished by `role`.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| role | UserRole | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary key:** `id`
- **Foreign keys:** none
- **Unique constraints:** `email`

---

## 2. DoctorProfile

One-to-one extension of a `User` whose role is doctor. Holds clinical identity fields that do not belong on every user.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| userId | INTEGER | FK → User.id, UNIQUE, NOT NULL |
| specialization | VARCHAR(255) | NOT NULL |
| licenseNo | VARCHAR(100) | UNIQUE, NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary key:** `id`
- **Foreign keys:** `userId` → `User.id`
- **Unique constraints:** `userId`, `licenseNo`

---

## 3. Availability

Weekly time windows when a doctor can be booked. Multiple rows per doctor are allowed (one per day or slot).

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| doctorId | INTEGER | FK → DoctorProfile.id, NOT NULL |
| dayOfWeek | INTEGER | NOT NULL |
| startTime | TIME | NOT NULL |
| endTime | TIME | NOT NULL |

- **Primary key:** `id`
- **Foreign keys:** `doctorId` → `DoctorProfile.id`
- **Unique constraints:** none

---

## 4. Appointment

A booked visit linking a patient user and a doctor user, with a scheduled datetime and lifecycle status.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| patientId | INTEGER | FK → User.id, NOT NULL |
| doctorId | INTEGER | FK → User.id, NOT NULL |
| appointmentDate | TIMESTAMP | NOT NULL |
| status | AppointmentStatus | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary key:** `id`
- **Foreign keys:** `patientId` → `User.id`, `doctorId` → `User.id`
- **Unique constraints:** none

---

## 5. MedicalRecord

Clinical notes for a completed visit. At most one record per appointment.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| appointmentId | INTEGER | FK → Appointment.id, UNIQUE, NOT NULL |
| diagnosis | TEXT | NOT NULL |
| notes | TEXT | NULL |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary key:** `id`
- **Foreign keys:** `appointmentId` → `Appointment.id`
- **Unique constraints:** `appointmentId`

---

## 6. Prescription

Medications attached to a medical record. A record may have many prescriptions.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| medicalRecordId | INTEGER | FK → MedicalRecord.id, NOT NULL |
| medicineName | VARCHAR(255) | NOT NULL |
| dosage | VARCHAR(100) | NOT NULL |
| duration | VARCHAR(100) | NOT NULL |

- **Primary key:** `id`
- **Foreign keys:** `medicalRecordId` → `MedicalRecord.id`
- **Unique constraints:** none

---

## 7. Payment

Billing for an appointment. At most one payment row per appointment.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| appointmentId | INTEGER | FK → Appointment.id, UNIQUE, NOT NULL |
| amount | DECIMAL(10, 2) | NOT NULL |
| status | PaymentStatus | NOT NULL |
| paidAt | TIMESTAMP | NULL |

- **Primary key:** `id`
- **Foreign keys:** `appointmentId` → `Appointment.id`
- **Unique constraints:** `appointmentId`

---

## 8. AuditLog

Append-only integrity trail for a medical record. `previousHash` and `currentHash` chain successive actions.

| Column | Data Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PK, NOT NULL |
| medicalRecordId | INTEGER | FK → MedicalRecord.id, NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| previousHash | VARCHAR(255) | NOT NULL |
| currentHash | VARCHAR(255) | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary key:** `id`
- **Foreign keys:** `medicalRecordId` → `MedicalRecord.id`
- **Unique constraints:** none
