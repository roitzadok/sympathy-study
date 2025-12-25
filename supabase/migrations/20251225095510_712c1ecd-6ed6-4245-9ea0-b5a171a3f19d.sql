-- Create table for experiment participants
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    rotation_pair INTEGER NOT NULL, -- 0-5 representing which pair of videos to rotate
    video_order INTEGER[] NOT NULL, -- Array of video indices in randomized order
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for video responses
CREATE TABLE public.video_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    video_index INTEGER NOT NULL, -- Original video index (1-4)
    was_rotated BOOLEAN NOT NULL DEFAULT false,
    sympathy_rating INTEGER NOT NULL CHECK (sympathy_rating >= 1 AND sympathy_rating <= 10),
    presentation_order INTEGER NOT NULL, -- Order in which video was shown (1-4)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(participant_id, video_index)
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_responses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for participants (public experiment)
CREATE POLICY "Allow anonymous insert participants"
ON public.participants
FOR INSERT
WITH CHECK (true);

-- Allow anonymous insert for video responses
CREATE POLICY "Allow anonymous insert video responses"
ON public.video_responses
FOR INSERT
WITH CHECK (true);

-- Allow reading own participant data by email (for session continuity)
CREATE POLICY "Allow reading participants"
ON public.participants
FOR SELECT
USING (true);