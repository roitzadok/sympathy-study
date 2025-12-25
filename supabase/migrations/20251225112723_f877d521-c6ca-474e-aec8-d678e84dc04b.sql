-- Add DELETE policy for video_responses to allow cleanup of incomplete experiments
CREATE POLICY "Allow anonymous delete video responses" 
ON public.video_responses 
FOR DELETE 
USING (true);

-- Add DELETE policy for participants to allow re-registration
CREATE POLICY "Allow anonymous delete participants" 
ON public.participants 
FOR DELETE 
USING (true);