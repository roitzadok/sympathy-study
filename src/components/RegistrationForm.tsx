import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import InputMask from 'react-input-mask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useExperimentStore } from '@/store/experimentStore';
import { hashEmail, getVideoOrder } from '@/lib/experimentUtils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string()
    .transform(val => val.replace(/[^0-9]/g, ''))
    .refine(val => val.length >= 10, 'Phone number must be at least 10 digits'),
});

type FormData = z.infer<typeof formSchema>;

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setParticipant, setCurrentStep } = useExperimentStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const normalizedEmail = data.email.toLowerCase().trim();

    try {
      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (existingParticipant) {
        // Check if they completed the experiment (4 responses)
        const { data: responses } = await supabase
          .from('video_responses')
          .select('id')
          .eq('participant_id', existingParticipant.id);

        if (responses && responses.length >= 4) {
          toast.error('This email has already completed the experiment.');
          setIsSubmitting(false);
          return;
        }

        // Incomplete - delete old responses and participant
        await supabase
          .from('video_responses')
          .delete()
          .eq('participant_id', existingParticipant.id);

        await supabase
          .from('participants')
          .delete()
          .eq('id', existingParticipant.id);

        toast.info('Previous incomplete session cleared. Starting fresh.');
      }

      const rotationPair = hashEmail(normalizedEmail);
      const videoOrder = getVideoOrder(normalizedEmail);

      const { data: participant, error } = await supabase
        .from('participants')
        .insert({
          email: normalizedEmail,
          phone_number: data.phoneNumber,
          full_name: data.fullName,
          rotation_pair: rotationPair,
          video_order: videoOrder,
        })
        .select()
        .single();

      if (error) throw error;

      setParticipant(participant);
      setCurrentStep(1);
      toast.success('Registration successful! Let\'s begin the experiment.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          {...register('fullName')}
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Controller
          name="phoneNumber"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <InputMask
              mask="(999) 999-9999"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            >
              {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
                <Input
                  {...inputProps}
                  id="phoneNumber"
                  type="tel"
                  placeholder="(123) 456-7890"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
              )}
            </InputMask>
          )}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registering...
          </>
        ) : (
          'Begin Experiment'
        )}
      </Button>
    </form>
  );
}
