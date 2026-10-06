# ER Diagram

Mermaid entity-relationship diagram for the eight HealthChain tables. Column names, types, and nullability match `relational-schema.md` and `data-dictionary.md`. `MedicalRecord.notes` and `Payment.paidAt` are optional.

```mermaid
erDiagram
    User ||--o| DoctorProfile : "has"
    DoctorProfile ||--o{ Availability : "offers"
    User ||--o{ Appointment : "books as patient"
    User ||--o{ Appointment : "assigned as doctor"
    Appointment ||--o| MedicalRecord : "has"
    MedicalRecord ||--o{ Prescription : "includes"
    Appointment ||--o| Payment : "has"
    MedicalRecord ||--o{ AuditLog : "logged in"

    User {
        INTEGER id PK
        VARCHAR_255 name
        VARCHAR_255 email UK
        VARCHAR_255 password
        UserRole role
        TIMESTAMP createdAt
    }

    DoctorProfile {
        INTEGER id PK
        INTEGER userId FK,UK
        VARCHAR_255 specialization
        VARCHAR_100 licenseNo UK
        TIMESTAMP createdAt
    }

    Availability {
        INTEGER id PK
        INTEGER doctorId FK
        INTEGER dayOfWeek
        TIME startTime
        TIME endTime
    }

    Appointment {
        INTEGER id PK
        INTEGER patientId FK
        INTEGER doctorId FK
        TIMESTAMP appointmentDate
        AppointmentStatus status
        TIMESTAMP createdAt
    }

    MedicalRecord {
        INTEGER id PK
        INTEGER appointmentId FK,UK
        TEXT diagnosis
        TEXT notes "optional"
        TIMESTAMP createdAt
    }

    Prescription {
        INTEGER id PK
        INTEGER medicalRecordId FK
        VARCHAR_255 medicineName
        VARCHAR_100 dosage
        VARCHAR_100 duration
    }

    Payment {
        INTEGER id PK
        INTEGER appointmentId FK,UK
        DECIMAL_10_2 amount
        PaymentStatus status
        TIMESTAMP paidAt "optional"
    }

    AuditLog {
        INTEGER id PK
        INTEGER medicalRecordId FK
        VARCHAR_100 action
        VARCHAR_255 previousHash
        VARCHAR_255 currentHash
        TIMESTAMP createdAt
    }
```
