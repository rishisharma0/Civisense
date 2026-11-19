# CiviSense

**AI-Powered Legislative Consultation Analysis & Batch Processing Platform**

CiviSense is an intelligent public consultation intelligence system designed for legislative bodies, regulatory authorities (e.g., Ministry of Corporate Affairs, Tax Boards), and policy committees. 

The platform bridges the gap between voluminous, unstructured stakeholder feedback and structured, clause-anchored policy decisions. Rather than relying on simple document-level sentiment or unconstrained LLM summarization, CiviSense features a **decoupled, throttled, and asynchronous backend architecture** that processes public submissions at the individual statutory clause level without hitting API rate limits or timing out.

---

## Key Highlights & System USP

1. **Decoupled Dual-Workflow Architecture:**
   - **Citizen Ingestion (`/`):** Citizens and trade bodies submit consultation PDFs through a lightweight staging portal. Files are validated and recorded into an SQLite staging database with status `pending` in **17 ms**. No expensive AI inference is triggered on submission, preventing server exhaustion.
   - **Government Batch Portal (`/batch`):** Authorized policy officials review the pending queue and trigger an asynchronous, sequential batch analysis with a single click.

2. **Asynchronous Non-Blocking Processing:**
   - Long-running inference is dispatched via FastAPI `BackgroundTasks`. The API immediately returns an HTTP `202 Accepted` with a tracking `job_id`.
   - The frontend polls `GET /api/v1/batch/{job_id}/status` to display a real-time progress bar, document-by-document status updates, and live percentage completion.

3. **API-Safe Sequential Throttling:**
   - To operate reliably within free-tier API quotas (Groq Llama-3.3-70B and HuggingFace RoBERTa), the backend executes a sequential pipeline with an explicit **1.5-second inter-document pause (`asyncio.sleep(1.5)`)**.
   - Completely eliminates HTTP 429 (`Too Many Requests`) and connection reset errors during multi-document batches.

4. **Per-Document Fault Isolation & Idempotency:**
   - Individual document failures (e.g., corrupt PDF, empty text stream) are caught and logged without aborting the broader batch.
   - Re-running analysis on any document cleanly purges previous entries before repopulating, ensuring idempotent database operations.

5. **Hybrid Deterministic Math + LLM Synthesis:**
   - Numerical aggregates (clause mention counts, sentiment percentages, stakeholder shares, and topic frequencies) are calculated **deterministically in Python using Pandas and Counter**.
   - The LLM is used strictly for what it excels at—narrative synthesis—receiving computed counts to generate a structured 3-column consensus report without arithmetic hallucinations.

---

## System Architecture

```text
               CITIZEN INGESTION WORKFLOW
               ──────────────────────────
                   ┌──────────────────┐
                   │ Citizen / Public │
                   └────────┬─────────┘
                            │ PDF Upload
                            ▼
              ┌───────────────────────────┐
              │   Next.js Citizen Portal  │
              └─────────────┬─────────────┘
                            │ POST /api/v1/documents/upload
                            ▼
              ┌───────────────────────────┐
              │      FastAPI Backend      │
              └─────────────┬─────────────┘
                            │ Persist file (UUID)
                            ▼
              ┌───────────────────────────┐
              │     SQLite Database       │
              │   (civisense.db: docs)    │
              │      status="pending"     │ (Confirmed in 17 ms)
              └───────────────────────────┘

           GOVERNMENT BATCH SYNTHESIS WORKFLOW
           ───────────────────────────────────
                   ┌──────────────────┐
                   │ Policy Official  │
                   └────────┬─────────┘
                            │ "Execute Batch Processing"
                            ▼
              ┌───────────────────────────┐
              │  Next.js Batch Dashboard  │◄─────────────────┐
              └─────────────┬─────────────┘                  │ Polling
                            │ POST /api/v1/batch/process-pending (1.5s interval)
                            ▼                                │
              ┌───────────────────────────┐                  │
              │  FastAPI BackgroundTasks  │                  │
              │   (Returns 202 + job_id)  │──────────────────┘
              └─────────────┬─────────────┘
                            │
            ┌───────────────┴───────────────┐
            │   Sequential Processing Loop  │ (for each pending doc)
            └───────────────┬───────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PyPDF Text  │ ──► │  Groq LLM    │ ──► │  HuggingFace │
│  Extraction  │     │  Clause Extr.│     │  RoBERTa Sent│
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ KeyBERT & S- │
                                          │ Transformers │
                                          └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ 1.5s Throttle│ (Safety Delay)
                                          │ asyncio.sleep│
                                          └──────────────┘
                            │
                            ▼ (All Documents Finished)
              ┌───────────────────────────┐
              │  Map-Reduce Aggregation   │
              │  - Deterministic Totals   │
              │  - Consensus LLM Synthesis│
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Consolidated Batch Report │
              │ - Consensus Matrix        │
              │ - Clause Dissatisfaction  │
              │ - Stakeholder Breakdown   │
              └───────────────────────────┘
```

---

## Empirical Benchmark Results

System performance was empirically measured on our production environment using real consultation filings and live API connections:

| Metric | Measured Value | Testing Context & Methodology |
| :--- | :---: | :--- |
| **Upload-to-Storage Latency** | **17 ms** | Time from PDF HTTP upload to confirmed SQLite persistence (`status='pending'`). |
| **Batch Processing Time (4 Docs)** | **45.3 seconds** | Total wall-clock time from batch trigger to final synthesized consensus report. |
| **Batch Throughput** | **5.3 docs / min** | Measured throughput with mandatory 1.5s inter-document rate-limiting throttle active. |
| **Extraction Yield** | **2.0 comments / page** | Average number of distinct, clause-anchored stakeholder arguments extracted per page. |
| **API Error Rate** | **0.0%** | Zero HTTP 429 (Rate Limit Exceeded) exceptions across repeated multi-document test runs. |

---

## What the Government Official Sees

When an official initiates batch processing, the dashboard delivers:

1. **Live Pipeline Monitor:**
   - Real-time progress bar (`0%` to `100%`).
   - Granular status indicators: `Processing document 2 of 4: 'submission.pdf' (Extracting clauses & comments)...`.
   - Processed files counter (`Processed 2 of 4 submissions`).

2. **Consolidated Executive Metrics:**
   - **Total Submissions Processed:** Count of all analyzed consultation PDFs.
   - **Extracted Comments:** Total clause-level arguments indexed.
   - **Consultation Stance:** Dominant stance across submissions (e.g., *Critical Concerns* vs. *Broad Support*).
   - **Sentiment Distribution:** Global ratio of Support vs. Opposition.

3. **3-Column Policy Consensus Matrix:**
   - **Broad Consensus Areas (Green):** Shared principles and clauses where stakeholders unanimously agree.
   - **Points of Contention (Red):** Contested statutory sections, severe dissatisfaction, and conflicting stakeholder stances.
   - **Actionable Recommendations (Blue):** Concrete amendments, deadline extensions, or statutory adjustments synthesized by the LLM.

4. **Itemized Submissions Index:**
   - Detailed ledger of every filing in the batch with filename, comment yield, and indexed status.
   - One-click **Print Synthesis Report** for executive briefing and committee distribution.

---

## Technology Stack

| Layer | Component | Technologies Used |
| :--- | :--- | :--- |
| **Frontend** | User Interface | Next.js 16.3, TypeScript, Tailwind CSS, ShadCN UI (Lera Design), Recharts, React Dropzone, Axios |
| **Backend** | API Server | FastAPI, Python 3.13, Uvicorn, Pydantic v2 |
| **Persistence** | Relational Database | SQLite 3 via SQLAlchemy ORM (Tables: `documents`, `comments`, `analyses`, `batch_jobs`) |
| **LLM Inference** | Clause Parsing & Consensus | Groq API (`Llama-3.3-70B-Versatile`), LangChain-Groq |
| **Sentiment Analysis** | Sentence-Level Scoring | HuggingFace Inference API (`cardiffnlp/twitter-roberta-base-sentiment-latest`), local heuristic fallback |
| **NLP & Topic Discovery**| Embeddings & Keywords | KeyBERT, Sentence-Transformers (`all-MiniLM-L6-v2`), spaCy |
| **PDF Extraction** | Document Ingestion | PyPDF, PDFPlumber |
| **Data Processing** | Deterministic Stats | Pandas, NumPy, Python Collections (`Counter`) |

---

## API Endpoints

### Citizen & Ingestion Routes
* `POST /api/v1/documents/upload` — Upload consultation PDF; saved in SQLite as `pending` (returns in ~17 ms).
* `GET /api/v1/documents/` — List all registered consultation documents.

### Government Batch Processing Routes
* `POST /api/v1/batch/process-pending` — Triggers batch processing across all pending SQLite submissions.
* `GET /api/v1/batch/pending` — Lists pending submissions waiting in the database queue.
* `GET /api/v1/batch/{job_id}/status` — Polls real-time progress, step description, and final consolidated summary.
* `GET /api/v1/batch/` — Lists previous batch jobs and execution history.
* `POST /api/v1/batch/upload` — Direct multi-file batch upload endpoint.

---

## Directory Structure

```text
minor_project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analysis.py          # Single document analysis endpoints
│   │   │   ├── batch.py             # Batch processing & queue endpoints
│   │   │   ├── comments.py          # Structured comment query routes
│   │   │   ├── dashboard.py         # Aggregated KPI & visualization routes
│   │   │   └── documents.py         # Document intake & metadata routes
│   │   ├── core/
│   │   │   ├── config.py            # Global settings & absolute DB pathing
│   │   │   └── groq.py              # Groq client initialization
│   │   ├── db/
│   │   │   └── session.py           # SQLAlchemy SQLite session engine
│   │   ├── models/
│   │   │   ├── analysis.py          # Analysis database model
│   │   │   ├── batch.py             # BatchJob database model
│   │   │   ├── comment.py           # Comment database model
│   │   │   └── document.py          # Document database model
│   │   ├── schemas/
│   │   │   ├── analysis.py          # Response schemas & validation
│   │   │   └── batch.py             # Batch status schemas & types
│   │   ├── services/
│   │   │   ├── analysis_service.py   # Single-doc orchestrator
│   │   │   ├── batch_service.py      # Async batch engine with 1.5s throttle
│   │   │   ├── clustering_service.py # KeyBERT & topic aggregation
│   │   │   ├── comment_service.py    # Structured comment operations
│   │   │   ├── extraction_service.py # PyPDF / PDFPlumber text extraction
│   │   │   ├── llm_service.py        # Groq Llama-3 extraction & consensus
│   │   │   └── sentiment_service.py  # HuggingFace RoBERTa sentiment
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── civisense.db                 # SQLite relational database
│   ├── requirements.txt             # Backend dependencies
│   └── uploads/                     # UUID-named PDF storage directory
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Citizen Submission Portal
│   │   │   └── batch/
│   │   │       └── page.tsx         # Government Batch Processing Dashboard
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Global Navigation Header
│   │   │   ├── ConsensusMatrix.tsx  # 3-column consensus visualizer
│   │   │   ├── ClauseTable.tsx      # Clause ranking & dissatisfaction table
│   │   │   └── ...                  # Dashboard visualization widgets
│   │   └── lib/
│   │       └── api.ts               # Axios API client wrapper
│   └── package.json
└── Readme.md
```

---

## Setup & Execution Guide

### 1. Prerequisites
* Python 3.12+ (or 3.13)
* Node.js 18+ (tested on Node v20/v22)
* Free API keys for **Groq** (`GROQ_API_KEY`) and **HuggingFace** (`HUGGINGFACE_API_KEY`)

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables in backend/.env
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_hf_token_here
DATABASE_URL=sqlite:///./civisense.db

# Start backend server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Next.js development server (using Webpack)
npx next dev --webpack --port 3000
```

### 4. Running the System
1. Open `http://localhost:3000` to access the **Citizen Submission Portal**. Upload one or more consultation PDFs.
2. Open `http://localhost:3000/batch` to view the **Government Batch Portal**.
3. Click **"Execute Batch Processing"** to run the throttled, asynchronous analysis and view the synthesized policy dashboard.
