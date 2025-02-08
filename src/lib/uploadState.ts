// Create a simple state management for sharing the upload between pages
import { create } from 'zustand';

interface UploadState {
  pendingUpload: File | null;
  setPendingUpload: (file: File | null) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  pendingUpload: null,
  setPendingUpload: (file) => set({ pendingUpload: file }),
}));
