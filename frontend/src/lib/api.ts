import axios from "axios";
import { DashboardData, DocumentItem, BatchUploadResponse, BatchStatusResponse } from "@/types/analysis";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for LLM analysis pipeline
});

export const api = {
  /**
   * Upload a consultation PDF to the backend
   */
  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<DocumentItem>(
      "/documents/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Fetch all uploaded consultation documents
   */
  async listDocuments(): Promise<DocumentItem[]> {
    const response = await apiClient.get<DocumentItem[]>("/documents/");
    return response.data;
  },

  /**
   * Fetch single document metadata
   */
  async getDocument(documentId: string): Promise<DocumentItem> {
    const response = await apiClient.get<DocumentItem>(
      `/documents/${documentId}`
    );
    return response.data;
  },

  /**
   * Delete an uploaded document
   */
  async deleteDocument(documentId: string): Promise<{ document_id: string; filename: string }> {
    const response = await apiClient.delete<{ document_id: string; filename: string }>(
      `/documents/${documentId}`
    );
    return response.data;
  },

  /**
   * Start AI extraction and analysis pipeline
   */
  async startAnalysis(documentId: string): Promise<{
    document_id: string;
    status: string;
    comments_extracted: number;
  }> {
    const response = await apiClient.post(
      `/analysis/${documentId}`
    );
    return response.data;
  },

  /**
   * Fetch full dashboard analytics and parsed comments
   */
  async getDashboard(documentId: string): Promise<DashboardData> {
    const response = await apiClient.get<DashboardData>(
      `/dashboard/${documentId}`
    );
    return response.data;
  },

  /**
   * Upload multiple consultation PDFs for background batch processing
   */
  async uploadBatch(files: File[]): Promise<BatchUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post<BatchUploadResponse>(
      "/batch/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Poll real-time progress and status of a batch job
   */
  async getBatchStatus(jobId: string): Promise<BatchStatusResponse> {
    const response = await apiClient.get<BatchStatusResponse>(
      `/batch/${jobId}/status`
    );
    return response.data;
  },

  /**
   * Fetch unanalyzed citizen submissions pending in the database
   */
  async getPendingSubmissions(): Promise<{
    pending_count: number;
    documents: Array<{
      document_id: string;
      filename: string;
      status: string;
      uploaded_at: string;
    }>;
  }> {
    const response = await apiClient.get("/batch/pending");
    return response.data;
  },

  /**
   * Trigger batch processing on all pending citizen submissions in DB
   */
  async processPendingSubmissions(): Promise<BatchUploadResponse> {
    const response = await apiClient.post<BatchUploadResponse>(
      "/batch/process-pending"
    );
    return response.data;
  },

  /**
   * List previous batch analysis jobs
   */
  async listBatches(): Promise<Array<{ job_id: string; status: string; total_files: number; processed_files: number; current_step: string; created_at: string; completed_at?: string | null }>> {
    const response = await apiClient.get("/batch/");
    return response.data;
  },
};
