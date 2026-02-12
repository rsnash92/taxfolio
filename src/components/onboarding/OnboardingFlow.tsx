'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingProgress } from './OnboardingProgress';
import { StepAboutYou } from './StepAboutYou';
import { StepHmrc } from './StepHmrc';
import { StepBank } from './StepBank';
import { StepComplete } from './StepComplete';
import type { OnboardingData } from '@/app/onboarding/page';

interface OnboardingFlowProps {
  initialData: OnboardingData;
}

export function OnboardingFlow({ initialData }: OnboardingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<OnboardingData>(initialData);
  const [saving, setSaving] = useState(false);

  const saveProgress = useCallback(async (updates: Partial<OnboardingData>, complete?: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, complete }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save onboarding progress:', err);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // Handle OAuth return params
  useEffect(() => {
    const hmrcConnected = searchParams.get('hmrc_connected') === 'true';
    const bankConnected = searchParams.get('bank_connected') === 'true';

    if (hmrcConnected && !data.hmrcConnected) {
      const updated = { ...data, hmrcConnected: true, currentStep: 3 };
      setData(updated);
      saveProgress({ hmrcConnected: true, currentStep: 3 });
      router.replace('/onboarding', { scroll: false });
    } else if (bankConnected && !data.bankConnected) {
      const updated = { ...data, bankConnected: true, currentStep: 4 };
      setData(updated);
      saveProgress({ bankConnected: true, currentStep: 4 });
      router.replace('/onboarding', { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToStep = (step: number) => {
    setData((d) => ({ ...d, currentStep: step }));
  };

  const handleAboutYou = async (aboutYou: NonNullable<OnboardingData['aboutYou']>) => {
    const updated = { ...data, aboutYou, currentStep: 2 };
    setData(updated);
    await saveProgress({ aboutYou, currentStep: 2 });
  };

  const handleHmrcConnect = () => {
    document.cookie = 'onboarding-context=hmrc; path=/; max-age=600; SameSite=Lax';
    window.location.href = '/api/mtd/auth/authorize';
  };

  const handleHmrcSkip = async () => {
    const updated = { ...data, hmrcSkipped: true, currentStep: 3 };
    setData(updated);
    await saveProgress({ hmrcSkipped: true, currentStep: 3 });
  };

  const handleBankConnect = () => {
    document.cookie = 'onboarding-context=bank; path=/; max-age=600; SameSite=Lax';
    window.location.href = '/api/truelayer/auth/authorize';
  };

  const handleBankSkip = async () => {
    const updated = { ...data, bankSkipped: true, currentStep: 4 };
    setData(updated);
    await saveProgress({ bankSkipped: true, currentStep: 4 });
  };

  const handleComplete = async () => {
    await saveProgress({ currentStep: 4 }, true);
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (data.currentStep) {
      case 1:
        return (
          <StepAboutYou
            initialData={data.aboutYou}
            onNext={handleAboutYou}
            saving={saving}
          />
        );
      case 2:
        return (
          <StepHmrc
            connected={data.hmrcConnected}
            onConnect={handleHmrcConnect}
            onSkip={handleHmrcSkip}
            onBack={() => goToStep(1)}
            saving={saving}
          />
        );
      case 3:
        return (
          <StepBank
            connected={data.bankConnected}
            onConnect={handleBankConnect}
            onSkip={handleBankSkip}
            onBack={() => goToStep(2)}
            saving={saving}
          />
        );
      case 4:
        return (
          <StepComplete
            hmrcConnected={data.hmrcConnected}
            hmrcSkipped={data.hmrcSkipped}
            bankConnected={data.bankConnected}
            bankSkipped={data.bankSkipped}
            onComplete={handleComplete}
            onBack={() => goToStep(3)}
            saving={saving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <OnboardingProgress currentStep={data.currentStep} />
      {renderStep()}
    </div>
  );
}
