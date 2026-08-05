# API Routes

Base URL:

```text
/api
```

---

# Health Routes

## Health Check

### GET /api/health

Verify API status.

Response:

```json
{
  "status": "healthy"
}
```

---

# Document Routes

## Upload Document

### POST /api/documents/upload

Upload one or more consultation documents.

Supported:

* PDF
* CSV
* XLSX (future)

Request:

```multipart
files: [file1.pdf, file2.pdf]
```

Response:

```json
{
  "document_id": "doc_123",
  "filename": "consultation.pdf",
  "pages": 25
}
```

---

## Get Uploaded Documents

### GET /api/documents

Returns all uploaded documents.

Response:

```json
[
  {
    "document_id": "doc_123",
    "filename": "consultation.pdf"
  }
]
```

---

## Get Document Details

### GET /api/documents/{document_id}

Returns metadata.

Response:

```json
{
  "document_id": "doc_123",
  "filename": "consultation.pdf",
  "pages": 25,
  "uploaded_at": "..."
}
```

---

## Delete Document

### DELETE /api/documents/{document_id}

Removes uploaded document.

---

# Analysis Routes

## Analyze Document

### POST /api/analysis/{document_id}

Runs complete pipeline.

Pipeline:

1. Extract text
2. Chunk text
3. Summarize
4. Sentiment analysis
5. Keyword extraction
6. Clause extraction
7. Consensus generation

Response:

```json
{
  "analysis_id": "analysis_123",
  "status": "completed"
}
```

---

## Get Analysis Result

### GET /api/analysis/{analysis_id}

Returns complete result.

Response:

```json
{
  "summary": "...",
  "sentiment": {},
  "keywords": [],
  "clauses": {},
  "consensus": {}
}
```

---

# Summary Routes

## Generate Summary

### POST /api/summary

Request:

```json
{
  "text": "..."
}
```

Response:

```json
{
  "summary": "..."
}
```

Useful for testing prompts independently.

---

## Get Document Summary

### GET /api/summary/{analysis_id}

Response:

```json
{
  "summary": "..."
}
```

---

# Sentiment Routes

## Analyze Sentiment

### POST /api/sentiment

Request:

```json
{
  "text": "..."
}
```

Response:

```json
{
  "label": "mixed",
  "confidence": 0.92
}
```

---

## Get Sentiment Statistics

### GET /api/sentiment/{analysis_id}

Response:

```json
{
  "positive": 42,
  "negative": 31,
  "neutral": 27
}
```

---

# Clause Intelligence Routes

## Extract Clauses

### POST /api/clauses

Request:

```json
{
  "text": "..."
}
```

Response:

```json
{
  "clauses": [
    "Section 135(5)",
    "Clause 4"
  ]
}
```

---

## Get Clause Analysis

### GET /api/clauses/{analysis_id}

Response:

```json
{
  "Section 135(5)": {
    "mentions": 42,
    "positive": 8,
    "negative": 30,
    "neutral": 4
  }
}
```

---

# Topic Routes

## Extract Topics

### POST /api/topics

Request:

```json
{
  "text": "..."
}
```

Response:

```json
{
  "topics": [
    "CSR Compliance",
    "Penalty Structure",
    "Reporting Requirements"
  ]
}
```

---

## Get Topic Analysis

### GET /api/topics/{analysis_id}

Response:

```json
{
  "topics": [
    {
      "name": "Penalty Structure",
      "frequency": 35
    }
  ]
}
```

---

# Consensus Routes

## Generate Consensus

### POST /api/consensus/{analysis_id}

Response:

```json
{
  "supported_provisions": [],
  "criticized_provisions": [],
  "recommendations": []
}
```

---

## Get Consensus Report

### GET /api/consensus/{analysis_id}

Response:

```json
{
  "overview": "...",
  "supported_provisions": [],
  "criticized_provisions": [],
  "minority_concerns": []
}
```

---

# Visualization Routes

## Word Cloud Data

### GET /api/visualizations/wordcloud/{analysis_id}

Response:

```json
{
  "keywords": [
    {
      "word": "CSR",
      "count": 52
    }
  ]
}
```

---

## Dashboard Analytics

### GET /api/dashboard/{analysis_id}

Single endpoint optimized for frontend dashboard.

Response:

```json
{
  "summary": "...",
  "sentiment": {},
  "keywords": [],
  "clauses": {},
  "consensus": {},
  "charts": {}
}
```

---

# Export Routes

## Export Analysis Report

### GET /api/export/{analysis_id}

Formats:

* PDF
* JSON

Response:

```json
{
  "download_url": "..."
}
```
