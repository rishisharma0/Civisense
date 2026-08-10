from pathlib import Path

from fastapi import HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


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

        try:
            loader = PyPDFLoader(str(path))

            pages = loader.load()

        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"failed to read the PDF:{str(e)}"
            )

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="PDF contains no readable text",
            )

        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)

        chunks = splitter.split_documents(pages)

        return [
            {
                "content": chunk.page_content,
                "page": chunk.metadata.get("page", 0) + 1,
            }
            for chunk in chunks
        ]
