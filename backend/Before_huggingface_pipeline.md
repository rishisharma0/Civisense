# CiviSense Backend — LangChain & Groq Phase

This document defines the backend routes and services required for the first AI-processing phase of CiviSense.

This phase covers:

* PDF handling
* PDF text extraction using LangChain
* Text chunking
* Comment extraction using Groq
* Topic/clause/issue extraction
* Recommendation extraction
* Overall summary generation
* Stakeholder-specific summaries
* Consensus generation
* Storing extracted comments and analysis in PostgreSQL

**Sentiment analysis, Hugging Face, embeddings, issue clustering, and dashboard services are intentionally excluded from this phase.**

---

# Routes

## 1. Document Routes

### `POST /api/v1/documents/upload`

Uploads a consultation PDF.

### Does

```text
PDF
 ↓
Validate file
 ↓
Generate unique filename
 ↓
Save PDF to uploads/
 ↓
Create Document database record
```

### Returns

```json
{
  "document_id": "uuid",
  "filename": "consultation.pdf",
  "uploaded_at": "2026-08-10T12:00:00"
}
```

---

## 2. `GET /api/v1/documents`

Returns all uploaded consultation documents.

### Does

```text
PostgreSQL
 ↓
Fetch documents
 ↓
Return document metadata
```

### Returns

```json
[
  {
    "document_id": "uuid",
    "filename": "gst-consultation.pdf",
    "uploaded_at": "2026-08-10T12:00:00"
  },
  {
    "document_id": "uuid",
    "filename": "corporate-law.pdf",
    "uploaded_at": "2026-08-10T12:15:00"
  }
]
```

This route does **not** perform PDF processing or AI analysis.

---

## 3. `GET /api/v1/documents/{document_id}`

Returns information about one uploaded document.

### Does

```text
document_id
 ↓
Find Document
 ↓
Return metadata
```

### Returns

```json
{
  "document_id": "uuid",
  "filename": "gst-consultation.pdf",
  "uploaded_at": "2026-08-10T12:00:00"
}
```

If the document doesn't exist:

```json
{
  "detail": "Document not found"
}
```

HTTP status:

```text
404
```

---

## 4. `DELETE /api/v1/documents/{document_id}`

Deletes an uploaded consultation.

### Does

```text
Document
 ↓
Delete PDF from uploads/
 ↓
Delete Document row
 ↓
Cascade delete related comments
 ↓
Cascade delete related analysis
```

### Returns

```json
{
  "document_id": "uuid",
  "filename": "gst-consultation.pdf"
}
```

---

# Analysis Routes

## 5. `POST /api/v1/analysis/{document_id}`

Starts the complete **LangChain + Groq analysis pipeline** for a document.

This is the main AI route.

### Does

```text
Document
   ↓
Read PDF
   ↓
LangChain PDF extraction
   ↓
Text chunks
   ↓
Groq
   ↓
Extract individual comments
   ↓
Extract stakeholder
   ↓
Extract topic
   ↓
Extract issue
   ↓
Extract clause
   ↓
Extract recommendation
   ↓
Save comments
   ↓
Groq
   ↓
Generate overall summary
   ↓
Generate stakeholder summaries
   ↓
Generate consensus
   ↓
Save Analysis
```

### Returns

```json
{
  "document_id": "uuid",
  "status": "analysis_completed"
}
```

The detailed results are retrieved through:

```text
GET /api/v1/analysis/{document_id}
```

---

## 6. `GET /api/v1/analysis/{document_id}`

Returns the completed high-level analysis of a document.

### Does

```text
document_id
 ↓
Find Analysis
 ↓
Return generated analysis
```

### Returns

```json
{
  "document_id": "uuid",

  "overall_summary": "The consultation received significant concerns regarding compliance burden and reporting requirements.",

  "stakeholder_summary": {
    "Chartered Accountants": "Major concerns relate to GST filing frequency and compliance costs.",
    "Corporate Lawyers": "Major concerns relate to legal ambiguity and penalties.",
    "Industry Bodies": "Major concerns relate to compliance burden.",
    "Professional Associations": "Major concerns relate to reporting requirements.",
    "Citizens": "Major concerns relate to accessibility and implementation."
  },

  "consensus": {
    "agreements": [
      "Reporting requirements should be simplified."
    ],
    "disagreements": [
      "Stakeholders differed on the proposed filing frequency."
    ],
    "recommendations": [
      "Simplify reporting requirements."
    ]
  }
}
```

If analysis has not been generated:

```json
{
  "detail": "Analysis not found"
}
```

---

# Services

The routes should remain thin.

The actual processing belongs inside services.

---

# 1. `pdf_service.py`

Responsible for **PDF file management**.

It does not perform AI processing.

## `upload_pdf()`

### Does

```text
UploadFile
 ↓
Validate PDF
 ↓
Generate unique filename
 ↓
Save PDF
 ↓
Create Document database record
```

### Returns

```text
Document
```

---

## `get_all_documents()`

### Does

Fetches all documents from PostgreSQL.

### Returns

```python
list[dict]
```

Example:

```json
[
  {
    "document_id": "uuid",
    "filename": "consultation.pdf",
    "uploaded_at": "..."
  }
]
```

---

## `get_document()`

### Does

Finds a document using its UUID.

### Returns

```python
dict
```

Example:

```json
{
  "document_id": "uuid",
  "filename": "consultation.pdf",
  "uploaded_at": "..."
}
```

---

## `delete_document()`

### Does

```text
Find Document
 ↓
Delete physical PDF
 ↓
Delete database record
 ↓
Cascade comments + analysis
```

### Returns

```python
dict
```

Example:

```json
{
  "document_id": "uuid",
  "filename": "consultation.pdf"
}
```

---

# 2. `extraction_service.py`

Responsible for converting the uploaded PDF into usable text.

Uses **LangChain**.

It does not call Groq.

## `extract_text()`

### Does

```text
PDF path
 ↓
PyPDFLoader
 ↓
PDF pages
 ↓
Extract page text
```

### Returns

LangChain `Document` objects containing:

```text
page_content
metadata
```

Example:

```python
[
    Document(
        page_content="The proposed GST amendment...",
        metadata={"page": 0}
    ),
    Document(
        page_content="Stakeholders recommended...",
        metadata={"page": 1}
    )
]
```

---

## `split_into_chunks()`

### Does

Splits extracted PDF text into smaller chunks using LangChain's text splitter.

```text
PDF pages
 ↓
Text splitter
 ↓
Chunks
```

### Returns

```python
list[Document]
```

Example:

```python
[
    {
        "page_content": "...",
        "metadata": {
            "page": 5
        }
    },
    {
        "page_content": "...",
        "metadata": {
            "page": 6
        }
    }
]
```

---

# 3. `llm_service.py`

Responsible for all **Groq LLM operations**.

This service contains the intelligence that interprets the extracted text.

---

## `extract_comments()`

Takes PDF chunks and identifies individual consultation responses.

### Does

```text
PDF chunks
 ↓
Groq
 ↓
Identify individual comments
 ↓
Extract structured information
```

For each comment, the LLM identifies:

* stakeholder type
* comment content
* topic
* raw issue
* clause
* recommendation

### Returns

Structured comment data.

Example:

```json
[
  {
    "stakeholder_type": "Chartered Accountants",
    "content": "The proposed GST filing frequency will significantly increase compliance costs.",
    "topic": "GST",
    "raw_issue": "Frequent GST filing requirements",
    "clause": "Section 12",
    "recommendation": "Reduce filing frequency"
  }
]
```

---

## `generate_summary()`

Generates the overall summary of the consultation.

### Does

Takes the extracted/structured comments and asks Groq to summarize the overall consultation.

### Returns

```python
str
```

Example:

```text
"The consultation received significant concerns regarding
compliance costs, reporting requirements and implementation
complexity."
```

---

## `generate_stakeholder_summary()`

Generates separate summaries for each stakeholder category.

### Does

Groups the relevant comments conceptually by stakeholder and generates a summary for each.

Supported stakeholder categories:

```text
Chartered Accountants
Corporate Lawyers
Industry Bodies
Professional Associations
Citizens
```

### Returns

```python
dict
```

Example:

```json
{
  "Chartered Accountants": "Concerns primarily focused on GST compliance and filing frequency.",
  "Corporate Lawyers": "Concerns focused on legal ambiguity and penalties.",
  "Industry Bodies": "Concerns focused on implementation costs.",
  "Professional Associations": "Concerns focused on reporting requirements.",
  "Citizens": "Concerns focused on accessibility and implementation."
}
```

---

## `generate_consensus()`

Identifies areas where stakeholders agree, disagree, and what recommendations emerge.

### Does

Analyzes the structured comments and identifies:

* common agreements
* major disagreements
* common recommendations

### Returns

```python
dict
```

Example:

```json
{
  "agreements": [
    "Reporting requirements should be simplified."
  ],
  "disagreements": [
    "Stakeholders differed on the proposed filing frequency."
  ],
  "recommendations": [
    "Reduce unnecessary reporting requirements."
  ]
}
```

---

# 4. `comment_service.py`

Responsible for storing and retrieving structured comments.

It does **not** call Groq.

It receives already-processed structured data from `llm_service.py`.

---

## `create_comment()`

### Does

Creates one SQLAlchemy `Comment` object and saves it to PostgreSQL.

### Input

Structured comment:

```json
{
  "stakeholder_type": "Chartered Accountants",
  "content": "...",
  "topic": "GST",
  "raw_issue": "Filing frequency",
  "clause": "Section 12",
  "recommendation": "Reduce filing frequency"
}
```

### Returns

```text
Comment
```

---

## `create_comments()`

### Does

Saves multiple extracted comments for a document.

```text
LLM output
 ↓
Multiple Comment objects
 ↓
PostgreSQL
```

### Returns

```python
list[Comment]
```

---

## `get_comments()`

### Does

Fetches all comments belonging to a document.

### Returns

```python
list[Comment]
```

---

# 5. `analysis_service.py`

This is the **orchestrator**.

It does not implement PDF extraction or Groq prompts itself.

It calls the other services in the correct order.

## `analyze_document()`

### Does

```text
1. Find Document
        ↓
2. ExtractionService.extract_text()
        ↓
3. ExtractionService.split_into_chunks()
        ↓
4. LLMService.extract_comments()
        ↓
5. CommentService.create_comments()
        ↓
6. LLMService.generate_summary()
        ↓
7. LLMService.generate_stakeholder_summary()
        ↓
8. LLMService.generate_consensus()
        ↓
9. Create Analysis
        ↓
10. Save Analysis
```

### Returns

```python
dict
```

Example:

```json
{
  "document_id": "uuid",
  "status": "analysis_completed"
}
```

---

# Service Interaction

The services work together like this:

```text
                    analysis_service
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
      extraction       llm_service   comment_service
        service             │
             │              │
             ▼              ▼
          chunks       structured comments
                            │
                            ▼
                       PostgreSQL
                            │
                            ▼
                    summary / consensus
                            │
                            ▼
                       Analysis
```

---

# Complete LangChain + Groq Flow

```text
POST /api/v1/analysis/{document_id}
                    │
                    ▼
            AnalysisService
                    │
                    ▼
           ExtractionService
                    │
                    ▼
              PDF / LangChain
                    │
                    ▼
                 Chunks
                    │
                    ▼
              LLMService
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Extract Comments      High-level Analysis
          │                   │
          ▼                   ├── Overall Summary
   CommentService             ├── Stakeholder Summary
          │                   └── Consensus
          ▼
      PostgreSQL
          │
          └──────────────┐
                         ▼
                    Analysis
                         │
                         ▼
GET /api/v1/analysis/{document_id}
                         │
                         ▼
                  Analysis Response
```

---

# Scope of This Phase

### Included

```text
✓ PDF upload
✓ PDF storage
✓ PDF retrieval/deletion
✓ LangChain PDF loading
✓ Text extraction
✓ Text chunking
✓ Groq integration
✓ Comment extraction
✓ Stakeholder identification
✓ Topic identification
✓ Clause extraction
✓ Raw issue extraction
✓ Recommendation extraction
✓ Overall summary
✓ Stakeholder summaries
✓ Consensus
✓ Comment database storage
✓ Analysis database storage
```

### Not Included Yet

```text
✗ Hugging Face
✗ Sentiment analysis
✗ Embeddings
✗ Issue clustering
✗ Canonical issue generation
✗ Dashboard/chart aggregation
```

Those will be added as separate processing stages after this LangChain + Groq pipeline is working reliably.
