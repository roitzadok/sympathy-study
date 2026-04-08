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

async function callApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:8080' : '';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data: data.data };
  } catch (err) {
    console.error('API error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export const azureApi = {
  // Participants
  getParticipantByEmail: (email: string) =>
    callApi<Participant | null>(`/api/participants?email=${encodeURIComponent(email)}`),

  createParticipant: (participant: {
    email: string;
    phone_number: string;
    full_name: string;
    rotation_pair: number;
    video_order: number[];
  }) => callApi<Participant>('/api/participants', {
    method: 'POST',
    body: JSON.stringify(participant),
  }),

  deleteParticipant: (id: string) =>
    callApi<{ success: boolean }>(`/api/participants/${id}`, {
      method: 'DELETE',
    }),

  // Video Responses
  getResponsesByParticipant: (participant_id: string) =>
    callApi<VideoResponse[]>(`/api/video-responses?participant_id=${participant_id}`),

  createVideoResponse: (response: {
    participant_id: string;
    video_index: number;
    was_rotated: boolean;
    sympathy_rating: number;
    presentation_order: number;
  }) => callApi<VideoResponse>('/api/video-responses', {
    method: 'POST',
    body: JSON.stringify(response),
  }),

  deleteResponsesByParticipant: (participant_id: string) =>
    callApi<{ success: boolean }>(`/api/video-responses?participant_id=${participant_id}`, {
      method: 'DELETE',
    }),
};

export type { Participant, VideoResponse };
