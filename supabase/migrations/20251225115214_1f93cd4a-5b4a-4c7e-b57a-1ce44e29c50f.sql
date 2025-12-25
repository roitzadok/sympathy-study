-- Add SELECT policy for video_responses so we can check completion status
CREATE POLICY "Allow reading video responses" 
ON public.video_responses 
FOR SELECT 
USING (true);