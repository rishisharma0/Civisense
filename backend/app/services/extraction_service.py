from pathlib import Path
from typing import List

from fastapi import HTTPException


def _simple_text_split(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> List[str]:
    if not text:
        return []

    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start = max(0, end - chunk_overlap)

    return chunks


class ExtractionService:
    @staticmethod
    async def extract_text(file_path: str) -> list[dict]:
        """
        Extract text from a PDF and split it into chunks.

        Returns:
            [
                {
                    "content": "...",
                    "page": 1
                },
                ...
            ]
        """

        path = Path(file_path)

        if not path.exists():
            raise HTTPException(status_code=404, detail="PDF file not found")

        if path.suffix.lower() != ".pdf":
            raise HTTPException(
                status_code=400,
                detail="File is not PDF",
            )

        # Try LangChain loader and splitter if available; otherwise fall back
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            loader = PyPDFLoader(str(path))
            pages = loader.load()

            if not pages:
                raise ValueError("PDF contains no readable text")

            splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
            chunks = splitter.split_documents(pages)

            return [
                {
                    "content": chunk.page_content,
                    "page": chunk.metadata.get("page", 0) + 1,
                }
                for chunk in chunks
            ]
        except Exception:
            # Fallback: use pypdf to extract page text and a simple character splitter
            try:
                from pypdf import PdfReader

                reader = PdfReader(str(path))
                pages_text = []
                for i, p in enumerate(reader.pages):
                    try:
                        text = p.extract_text() or ""
                    except Exception:
                        text = ""
                    pages_text.append({"content": text, "page": i + 1})

                # aggregate into chunks
                all_chunks = []
                for pg in pages_text:
                    text = pg["content"]
                    for chunk in _simple_text_split(text, 1500, 200):
                        all_chunks.append({"content": chunk, "page": pg["page"]})

                if not all_chunks:
                    raise HTTPException(status_code=400, detail="PDF contains no readable text")

                return all_chunks
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"failed to read the PDF: {str(e)}")
