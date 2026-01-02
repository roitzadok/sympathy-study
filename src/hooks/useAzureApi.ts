import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  rotation_pair: number;
  video_order: number[];
  created_at?: string;
}

interface VideoResponse {
  id: string;
  participant_id: string;
  video_index: number;
  was_rotated: boolean;
  sympathy_rating: number;
  presentation_order: number;
  created_at?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function callAzureApi<T>(action: string, data: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const { data: response, error } = await supabase.functions.invoke('azure-db', {
      body: { action, data },
    });

    if (error) {
      console.error('Azure API error:', error);
      return { error: error.message };
    }

    if (response?.error) {
      console.error('Azure DB error:', response.error);
      return { error: response.error };
    }

    return { data: response?.data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export const azureApi = {
  // Participants
  getParticipantByEmail: (email: string) =>
    callAzureApi<Participant | null>('get_participant_by_email', { email }),

  createParticipant: (participant: {
    email: string;
    phone_number: string;
    full_name: string;
    rotation_pair: number;
    video_order: number[];
  }) => callAzureApi<Participant>('create_participant', participant),

  deleteParticipant: (id: string) =>
    callAzureApi<{ success: boolean }>('delete_participant', { id }),

  // Video Responses
  getResponsesByParticipant: (participant_id: string) =>
    callAzureApi<VideoResponse[]>('get_responses_by_participant', { participant_id }),

  createVideoResponse: (response: {
    participant_id: string;
    video_index: number;
    was_rotated: boolean;
    sympathy_rating: number;
    presentation_order: number;
  }) => callAzureApi<VideoResponse>('create_video_response', response),

  deleteResponsesByParticipant: (participant_id: string) =>
    callAzureApi<{ success: boolean }>('delete_responses_by_participant', { participant_id }),
};

export type { Participant, VideoResponse };
