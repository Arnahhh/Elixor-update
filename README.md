# 🩺 HealthChain

> **A decentralized, tamper-evident healthcare management platform secured by Ethereum wallet identity, smart contract cryptographic anchoring, and AI-powered longitudinal medical analysis.**

[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia_Testnet-3c3c3d?logo=ethereum&logoColor=white)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_pgvector-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini_%2B_Embeddings-412991?logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [The Three Core Workflows](#-the-three-core-workflows)
- [Database & Security Engineering (DBMS Focus)](#-database--security-engineering-dbms-focus)
- [Smart Contract Specification (`MedicalAudit.sol`)](#-smart-contract-specification-medicalauditsol)
- [Role-Based Interfaces](#-role-based-interfaces)
- [Repository Structure](#-repository-structure)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Running Tests & Builds](#-running-tests--builds)
- [Evaluation & Presentation Defense (FAQ)](#-evaluation--presentation-defense-faq)
- [Roadmap & Production Considerations](#-roadmap--production-considerations)

---

## 🌟 Overview

Modern electronic health record (EHR) systems face three critical vulnerabilities:
1. **Fragile, centralized credential systems** subject to credential stuffing and phishing attacks.
2. **Unverifiable document integrity**, making medical records vulnerable to silent modification or unauthorized alteration.
3. **Fragmented clinical context**, where doctors must read historical records manually without rapid longitudinal summarization.

**HealthChain** resolves these challenges by bridging **Web3 identity**, **cryptographic blockchain auditability**, and **Retrieval-Augmented Generation (RAG)** atop a strictly normalized **PostgreSQL** database:

- 🔑 **Passwordless Web3 Authentication**: Users authenticate using their Ethereum wallets via cryptographically signed challenge nonces (EIP-4361 / SIWE). No credentials or passwords ever cross the wire.
- ⛓️ **Zero-Knowledge Document Anchoring**: SHA-256 fingerprints of medical reports and prescriptions are permanently anchored on the Ethereum Sepolia blockchain. Documents remain fully private off-chain, while any party can prove authenticity and zero tampering.
- 🧠 **AI-Assisted Clinical Decision Support**: Uploaded clinical records are converted into dense vector embeddings using OpenAI (`text-embedding-3-small`) and queried via PostgreSQL's native `pgvector` extension to contextualize incoming lab reports with patient longitudinal history (`gpt-4o-mini`).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        User["User (MetaMask Wallet)"]
        UI["Next.js 14 Web App<br/>(Tailwind CSS + Zustand)"]
        User <--> UI
    end

    subgraph API ["Backend Gateway (Express + TypeScript)"]
        AuthRoute["Auth Handler<br/>(SIWE Nonce & Signature)"]
        RecordRoute["Reports & Prescriptions"]
        AIService["AI Engine<br/>(Embeddings & RAG)"]
        ChainService["Ethers.js Contract Service"]
        
        UI -->|EIP-4361 Signature| AuthRoute
        UI -->|Upload Report / Book Visit| RecordRoute
        RecordRoute --> AIService
        RecordRoute --> ChainService
    end

    subgraph Database ["Data & Storage Layer (Supabase PostgreSQL)"]
        UsersTab[("users & profiles<br/>(3NF Schema)")]
        AuditTab[("audit_logs<br/>(Automated Triggers)")]
        VectorsTab[("ai_analyses<br/>(pgvector ivfflat)")]
        ViewsTab[("Analytical Views<br/>v_patient_dashboard<br/>v_admin_analytics")]
        Storage[("Supabase Storage<br/>(medical-reports bucket)")]
    end

    subgraph External ["External Decoupled Systems"]
        Sepolia["Ethereum Sepolia Testnet<br/>MedicalAudit.sol"]
        OpenAI["OpenAI API<br/>(text-embedding-3-small & gpt-4o-mini)"]
    end

    AuthRoute -->|Verify Signature & Issue JWT| UsersTab
    RecordRoute -->|Enforce RLS & Store Off-Chain| UsersTab
    RecordRoute -->|Store Encrypted File| Storage
    RecordRoute -->|Audit Trail Trigger| AuditTab
    AIService -->|Match Cosine Similarity| VectorsTab
    AIService <-->|Generate Summary & Vectors| OpenAI
    ChainService -->|anchorRecord(recordId, hash)| Sepolia
```

---

## 🔄 The Three Core Workflows

### 1. Web3 Passwordless Authentication
Traditional username/password schemes and centralized OAuth providers introduce points of failure. HealthChain treats an **Ethereum public address** as an immutable identity:
1. **Nonce Challenge**: Client requests a one-time cryptographic nonce from `/api/auth/nonce`.
2. **Off-Chain Signature**: The user signs a human-readable challenge statement via MetaMask (gas-free, EIP-4361 compliant).
3. **Cryptographic Recovery**: The backend uses `ethers.verifyMessage` to recover the signer's public address.
4. **JWT Issuance**: Once confirmed against `auth_nonces`, the backend issues a signed JWT containing custom claims (`app_user_id`, `app_role`) consumed directly by Supabase for Row-Level Security (RLS).

### 2. Longitudinal AI Medical Analysis (RAG)
When a medical report is received:
1. **Extraction**: Raw clinical text and test values are parsed.
2. **Dense Vectorization**: The text is passed to `text-embedding-3-small` (1,536 dimensions).
3. **Historical Retrieval**: Postgres executes `match_patient_analyses()` using `pgvector` cosine similarity (`vector_cosine_ops`) to retrieve historical abnormalities and lab trends for that specific patient.
4. **Clinical Decision Prompt**: The new report plus the longitudinal context is passed to `gpt-4o-mini` with strict system instructions to generate structured JSON flags (`summary`, `flags`, `severity`, `confidence`).
5. **Storage**: The structured analysis and vector embedding are saved in `ai_analyses`.

### 3. Cryptographic Medical Document Audit
Patient health data is governed by strict privacy standards (e.g., HIPAA/GDPR). Storing raw Protected Health Information (PHI) on a public blockchain is both cost-prohibitive and a serious compliance breach:
1. **Off-Chain Storage**: The document is stored in Supabase private bucket storage (`medical-reports`).
2. **Document Fingerprint**: A deterministic SHA-256 hash is computed over the document contents.
3. **On-Chain Anchor**: The backend's authorized signer wallet executes `MedicalAudit.anchorRecord(recordId, dataHash, recordType)` on Ethereum Sepolia.
4. **Public Verification**: Any stakeholder can verify that a medical document has not been tampered with by recalculating its SHA-256 hash and calling the view function `verifyRecord(recordId, hash)` on the smart contract.

---

## 💾 Database & Security Engineering (DBMS Focus)

The PostgreSQL data layer is architected according to strict relational database design principles:

### 1. Third Normal Form (3NF) Normalization
- Role-specific properties are decoupled into 1:1 extension tables (`doctor_profiles` and `patient_profiles`) rather than stuffing nullable columns into a monolithic `users` table.
- Append-only records (`ai_analyses`, `blockchain_transactions`, `audit_logs`) are modeled in isolated tables with strict foreign keys to preserve normalization.

### 2. Enterprise Constraints & Role Validation
- **Regex Format Enforcement**:
  - `chk_wallet_format`: `wallet_address ~* '^0x[a-f0-9]{40}$'`
  - `chk_file_hash_format`: `file_hash ~* '^[a-f0-9]{64}$'`
- **Domain Integrity**: `blood_group` enum check (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- **Entity Invariants**: `chk_appt_roles` prevents a user from scheduling an appointment with themselves (`patient_id <> doctor_id`).
- **Mutually Exclusive Transaction Targets**: `chk_one_target` enforces that a transaction entry references either a `report_id` or a `prescription_id`, never both or neither.

### 3. Automated Triggers & Change Capture
- **`trg_users_updated_at` & `trg_appointments_updated_at`**: Automatic timestamp maintenance.
- **`fn_audit_trigger`**: Fired `AFTER INSERT OR UPDATE OR DELETE` across all clinical tables. Automatically captures the operating user ID (`app.current_user_id`), operation (`INSERT`/`UPDATE`/`DELETE`), entity table, and full JSON `old` vs `new` diffs.
- **`fn_enforce_appointment_doctor_role`**: Database-level role verification ensuring that any UUID referenced as `doctor_id` strictly holds `role = 'doctor'`.

### 4. Materialized & Pre-Joined Analytical Views
- **`v_patient_dashboard`**: Pre-joins patient appointments with doctor details and specializations.
- **`v_doctor_dashboard`**: Aggregates assigned appointments with counts of prior patient lab reports.
- **`v_report_with_analysis`**: Multi-table join combining medical reports, latest AI structured summaries, and on-chain transaction verification states.
- **`v_admin_analytics`**: High-level platform metrics (total patients, doctors, reports, anchored hashes).
- **`v_doctor_weekly_load`**: Aggregates appointment volume per physician for capacity monitoring.

### 5. Native In-Database RAG via `pgvector`
Rather than introducing external vector database dependencies (e.g., Pinecone), embeddings are stored directly in `ai_analyses(embedding vector(1536))` indexed using an **IVFFlat** cosine index (`lists = 100`):
```sql
create or replace function match_patient_analyses(
    p_patient_id uuid,
    p_query_embedding vector(1536),
    p_match_threshold float default 0.65,
    p_match_count int default 3
)
returns table (
    report_id uuid,
    report_title text,
    summary text,
    similarity float
) language sql stable as $$
    select
        mr.id as report_id,
        mr.title as report_title,
        ai.summary,
        1 - (ai.embedding <=> p_query_embedding) as similarity
    from ai_analyses ai
    join medical_reports mr on mr.id = ai.report_id
    where mr.patient_id = p_patient_id
      and (1 - (ai.embedding <=> p_query_embedding)) > p_match_threshold
    order by ai.embedding <=> p_query_embedding
    limit p_match_count;
$$;
```

### 6. Row-Level Security (RLS) Defense
Access control is enforced directly by PostgreSQL policies using custom JWT claims (`app_user_id`, `app_role`):
- **Patients**: Can only query their own reports, prescriptions, and appointment records.
- **Doctors**: Restricted to accessing data for patients with whom they have an active appointment or clinical relationship.
- **Admins**: Granted cross-cutting analytics access.

---

## 📜 Smart Contract Specification (`MedicalAudit.sol`)

The Solidity contract is deployed on **Ethereum Sepolia** (`0.8.24`, EVM target `paris`):

```solidity
contract MedicalAudit {
    struct AuditRecord {
        bytes32 dataHash;      // sha256 fingerprint of off-chain document
        address submittedBy;   // Backend signer address
        uint256 timestamp;     // Block timestamp of anchoring
        string recordType;     // "report" | "prescription"
    }

    mapping(bytes32 => AuditRecord) public records;
    event RecordAnchored(bytes32 indexed recordId, bytes32 dataHash, string recordType, uint256 timestamp);

    function anchorRecord(bytes32 recordId, bytes32 dataHash, string calldata recordType) external onlyAuthorized;
    function verifyRecord(bytes32 recordId, bytes32 dataHash) external view returns (bool);
    function getRecord(bytes32 recordId) external view returns (AuditRecord memory);
}
```

- **Gas Optimization**: Stores only 32-byte fixed `bytes32` hashes instead of variable strings.
- **Immutable & Non-Overwritable**: Reverts if `records[recordId].timestamp != 0` to preserve tamper-proof history.
- **Access Control**: Restricted via `onlyAuthorized` modifier to approved backend transaction relayers.

---

## 🖥️ Role-Based Interfaces

| Portal | Primary Capabilities |
| :--- | :--- |
| **Patient Portal** | Connect MetaMask wallet, view clinical history, review AI-synthesized summaries, inspect live Sepolia Etherscan transaction proofs, and upload lab files. |
| **Doctor Portal** | Review assigned patients, examine historical lab reports with automated anomaly flags, and issue digital prescriptions. |
| **Admin Portal** | System overview displaying aggregate throughput metrics, system-wide transaction counts, provider workload charts, and system audit logs. |

---

## 📂 Repository Structure

```text
healthchain/
├── contracts/                  # Hardhat Ethereum workspace
│   ├── contracts/
│   │   └── MedicalAudit.sol    # Solidity document anchoring smart contract
│   ├── scripts/
│   │   └── deploy.ts           # Sepolia deployment script
│   ├── test/
│   │   └── MedicalAudit.test.ts # Hardhat unit tests
│   ├── hardhat.config.ts       # Network & optimizer configuration
│   └── tsconfig.json           # Contract TypeScript configuration
│
├── backend/                    # Express + TypeScript REST API
│   ├── src/
│   │   ├── config/             # Supabase client & environment configuration
│   │   ├── middleware/         # SIWE verification, JWT decoding, Rate limiting
│   │   ├── routes/             # auth, appointments, reports, prescriptions, admin
│   │   ├── services/           # ai.service.ts, blockchain.service.ts
│   │   └── index.ts            # Server entrypoint
│   └── tsconfig.json
│
├── frontend/                   # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                # App Router (pages: /, /patient, /doctor, /admin)
│   │   ├── hooks/              # useWalletAuth hook (MetaMask SIWE flow)
│   │   └── lib/                # API client & ethers helpers
│   └── tailwind.config.ts
│
├── db/                         # PostgreSQL / Supabase Migration Layer
│   ├── migrations/
│   │   ├── 001_core_schema.sql # 3NF tables, constraints, enums
│   │   ├── 002_triggers.sql    # Audit logging & role triggers
│   │   ├── 003_views.sql       # Dashboard analytical views
│   │   ├── 004_rls_policies.sql# PostgreSQL Row-Level Security
│   │   └── 005_rag_function.sql# pgvector search procedure
│   └── seed/
│       └── seed.sql            # Demo users, doctors, and appointments
│
├── ai/                         # Standalone Python RAG demonstration
│   ├── rag_demo.py             # Reproduces the RAG pipeline in Python
│   └── requirements.txt
│
└── docs/                       # Architectural notes and presentation guides
    └── presentation_notes.md
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/nonce` | Generate a 5-minute single-use nonce for wallet challenge. |
| `POST` | `/api/auth/verify` | Verify wallet signature (`ethers.verifyMessage`), mint role-scoped JWT. |

### Medical Reports (`/api/reports`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reports/upload` | Upload report, compute SHA-256 hash, trigger RAG analysis & Sepolia anchor. |
| `GET` | `/api/reports/:id` | Fetch report details with AI analysis and on-chain transaction status. |
| `GET` | `/api/reports/patient/:patientId` | List reports for a patient (enforced by RLS). |

### Appointments & Prescriptions (`/api/appointments`, `/api/prescriptions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/appointments` | Book appointment with doctor verification. |
| `GET` | `/api/appointments/my` | Fetch scheduled visits for logged-in user. |
| `POST` | `/api/prescriptions` | Create structured medication prescription. |

### Admin Analytics (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | Returns aggregated metrics from `v_admin_analytics`. |
| `GET` | `/api/admin/doctor-load` | Returns provider workload distribution from `v_doctor_weekly_load`. |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your_supabase_jwt_secret

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
SUPABASE_ANON_KEY=your_anon_public_key

# Ethereum Sepolia Testnet
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
AUDIT_CONTRACT_ADDRESS=0xYourDeployedMedicalAuditContractAddress
AUDIT_SIGNER_PRIVATE_KEY=your_testnet_account_private_key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o-mini

# CORS
FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Contracts (`contracts/.env`)
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
AUDIT_SIGNER_PRIVATE_KEY=your_testnet_account_private_key
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in `db/migrations/` sequentially:
   - `001_core_schema.sql`
   - `002_triggers.sql`
   - `003_views.sql`
   - `004_rls_policies.sql`
   - `005_rag_function.sql`
   - *(Optional)* `db/seed/seed.sql` to populate sample users and appointments.
4. Go to **Storage**, click **New Bucket**, and create a bucket named `medical-reports` (set to Private).
5. Copy your **Project URL**, **Anon Key**, **Service Role Key**, and **JWT Secret** (under API / JWT Settings).

### 2. Deploy Smart Contract
```bash
cd contracts
npm install
npx hardhat test
npx hardhat run scripts/deploy.ts --network sepolia
```
*Copy the outputted contract address to `backend/.env` under `AUDIT_CONTRACT_ADDRESS`.*

### 3. Start Backend API
```bash
cd backend
cp .env.example .env     # Populate your keys as shown above
npm install
npm run dev              # Server runs at http://localhost:4000
```

### 4. Start Frontend Client
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev              # Web client runs at http://localhost:3000
```

---

## 🧪 Running Tests & Builds

To verify the integrity of the full repository:

```bash
# 1. Smart Contract Unit Tests
cd contracts
npx hardhat test
# Expected: 2 passing (anchors and verifies record, rejects duplicates)

# 2. Backend TypeScript Compilation
cd ../backend
npm run build
# Expected: Clean compilation via tsc

# 3. Frontend Next.js Production Build
cd ../frontend
npm run build
# Expected: Static page generation and route compilation without errors

# 4. Standalone AI Python RAG Demonstration
cd ../ai
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
python rag_demo.py
```

---

## 🎯 Evaluation & Presentation Defense (FAQ)

### Q: Why use Ethereum Wallet Auth instead of Supabase Auth?
> **A:** Centralized authentication ties identity to an email provider, phone number, or company server. In HealthChain, the user's Ethereum address **is** their identity. Off-chain cryptographic signing (EIP-4361) proves ownership without passwords or central point of compromise.

### Q: Why anchor only the SHA-256 hash instead of storing documents directly on Ethereum?
> **A:** Storing raw Protected Health Information (PHI) on a public blockchain violates compliance mandates (e.g., HIPAA, GDPR's "Right to be Forgotten") and incurs high gas costs. Storing documents in private storage while anchoring the SHA-256 hash on-chain creates **zero-knowledge proof of existence**: document integrity is mathematically guaranteed without exposing private medical data.

### Q: Why use `pgvector` instead of Pinecone or Milvus?
> **A:** Utilizing PostgreSQL's native `pgvector` extension keeps all transactional data, audit logs, and vector representations in a single relational system. This enables atomic transactions, simplifies backups, reduces external infrastructure complexity, and eliminates data synchronization lag.

---

## 🗺️ Roadmap & Production Considerations

- [ ] **Background Processing Pipeline**: Decouple document anchoring and AI vectorization using an asynchronous task queue (BullMQ + Redis) to handle traffic spikes.
- [ ] **Automated Server-Side OCR**: Integrate Tesseract or AWS Textract to automatically extract text from raw medical scans and PDFs during upload.
- [ ] **Decentralized Storage Migration**: Introduce optional encrypted IPFS/Filecoin pinning alongside Supabase Storage.
- [ ] **Zero-Knowledge Proofs (ZKP)**: Implement zk-SNARK verifications for selective disclosure (e.g., proving a patient is vaccinated or has a clean test result without revealing identity or history).

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
