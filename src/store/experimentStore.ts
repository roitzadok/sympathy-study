import { create } from 'zustand';

interface Participant {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  rotation_pair: number;
  video_order: number[];
}

interface VideoResponse {
  videoIndex: number;
  wasRotated: boolean;
  sympathyRating: number;
  presentationOrder: number;
}

interface ExperimentState {
  participant: Participant | null;
  currentStep: number; // 0 = registration, 1-4 = video pages
  responses: VideoResponse[];
  setParticipant: (participant: Participant) => void;
  setCurrentStep: (step: number) => void;
  addResponse: (response: VideoResponse) => void;
  reset: () => void;
}

export const useExperimentStore = create<ExperimentState>((set) => ({
  participant: null,
  currentStep: 0,
  responses: [],
  setParticipant: (participant) => set({ participant }),
  setCurrentStep: (step) => set({ currentStep: step }),
  addResponse: (response) => set((state) => ({ 
    responses: [...state.responses, response] 
  })),
  reset: () => set({ participant: null, currentStep: 0, responses: [] }),
}));
