# Data Dictionary

Every column from the eight HealthChain tables, listed in one table.

| Table Name | Column Name | Data Type | Constraints (PK/FK/UNIQUE/NOT NULL/DEFAULT) | Description |
| --- | --- | --- | --- | --- |
| User | id | INTEGER | PK, NOT NULL | Unique identifier for the user account. |
| User | name | VARCHAR(255) | NOT NULL | Full display name of the user. |
| User | email | VARCHAR(255) | UNIQUE, NOT NULL | Login email; must be unique across all users. |
| User | password | VARCHAR(255) | NOT NULL | Hashed password used for authentication. |
| User | role | UserRole (PATIENT, DOCTOR, ADMIN) | NOT NULL | Access role that controls what the user can do. |
| User | createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date and time when the account was created. |
| DoctorProfile | id | INTEGER | PK, NOT NULL | Unique identifier for the doctor profile. |
| DoctorProfile | userId | INTEGER | FK → User.id, UNIQUE, NOT NULL | Linked user account; one profile per doctor user. |
| DoctorProfile | specialization | VARCHAR(255) | NOT NULL | Medical specialty the doctor practices. |
| DoctorProfile | licenseNo | VARCHAR(100) | UNIQUE, NOT NULL | Professional license number; unique per doctor. |
| DoctorProfile | createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date and time when the doctor profile was created. |
| Availability | id | INTEGER | PK, NOT NULL | Unique identifier for the availability slot. |
| Availability | doctorId | INTEGER | FK → DoctorProfile.id, NOT NULL | Doctor whose weekly slot this row describes. |
| Availability | dayOfWeek | INTEGER | NOT NULL | Day of the week for this slot (for example 0–6). |
| Availability | startTime | TIME | NOT NULL | Time of day when the doctor becomes available. |
| Availability | endTime | TIME | NOT NULL | Time of day when the availability slot ends. |
| Appointment | id | INTEGER | PK, NOT NULL | Unique identifier for the appointment. |
| Appointment | patientId | INTEGER | FK → User.id, NOT NULL | Patient user who booked the visit. |
| Appointment | doctorId | INTEGER | FK → User.id, NOT NULL | Doctor user assigned to the visit. |
| Appointment | appointmentDate | TIMESTAMP | NOT NULL | Scheduled date and time of the visit. |
| Appointment | status | AppointmentStatus (PENDING, CONFIRMED, COMPLETED, CANCELLED) | NOT NULL | Current lifecycle state of the appointment. |
| Appointment | createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date and time when the appointment was created. |
| MedicalRecord | id | INTEGER | PK, NOT NULL | Unique identifier for the medical record. |
| MedicalRecord | appointmentId | INTEGER | FK → Appointment.id, UNIQUE, NOT NULL | Appointment this record belongs to; one record per appointment. |
| MedicalRecord | diagnosis | TEXT | NOT NULL | Clinical diagnosis recorded for the visit. |
| MedicalRecord | notes | TEXT | NULL | Additional clinical notes for the visit. |
| MedicalRecord | createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date and time when the record was created. |
| Prescription | id | INTEGER | PK, NOT NULL | Unique identifier for the prescription line. |
| Prescription | medicalRecordId | INTEGER | FK → MedicalRecord.id, NOT NULL | Medical record this medication belongs to. |
| Prescription | medicineName | VARCHAR(255) | NOT NULL | Name of the prescribed medicine. |
| Prescription | dosage | VARCHAR(100) | NOT NULL | How much of the medicine to take. |
| Prescription | duration | VARCHAR(100) | NOT NULL | How long the medicine should be taken. |
| Payment | id | INTEGER | PK, NOT NULL | Unique identifier for the payment. |
| Payment | appointmentId | INTEGER | FK → Appointment.id, UNIQUE, NOT NULL | Appointment being billed; one payment row per appointment. |
| Payment | amount | DECIMAL(10, 2) | NOT NULL | Amount charged for the appointment. |
| Payment | status | PaymentStatus (PENDING, PAID, FAILED, REFUNDED) | NOT NULL | Current state of the payment. |
| Payment | paidAt | TIMESTAMP |  | Date and time the payment succeeded, if it has been paid. |
| AuditLog | id | INTEGER | PK, NOT NULL | Unique identifier for the audit log entry. |
| AuditLog | medicalRecordId | INTEGER | FK → MedicalRecord.id, NOT NULL | Medical record this integrity log entry refers to. |
| AuditLog | action | VARCHAR(100) | NOT NULL | Type of action recorded against the medical record. |
| AuditLog | previousHash | VARCHAR(255) | NOT NULL | Hash of the previous audit entry in the chain. |
| AuditLog | currentHash | VARCHAR(255) | NOT NULL | Hash of this audit entry for integrity checking. |
| AuditLog | createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date and time when the audit entry was written. |
