'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Gift } from 'lucide-react';
import { REFERRAL_CONFIG } from '@/lib/referrals/config';

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [introSession, setIntroSession] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pre-fill email and capture intro_session/ref from URL query parameters
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const sessionParam = searchParams.get('intro_session');
    const refParam = searchParams.get('ref');

    if (emailParam) {
      setEmail(emailParam);
    }
    if (sessionParam) {
      setIntroSession(sessionParam);
      localStorage.setItem('taxfolio_intro_session', sessionParam);
    }
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
      localStorage.setItem('taxfolio_referral_code', refParam.toUpperCase());
    }
  }, [searchParams]);

  // Function to link intro session after signup
  const linkIntroSession = async (userId: string, sessionId: string) => {
    try {
      const response = await fetch('/api/intro/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      });
      const result = await response.json();
      if (!result.success) {
        console.warn('Failed to link intro session:', result.error);
      }
    } catch (error) {
      console.error('Failed to link intro session:', error);
    }
  };

  // Function to apply referral code after signup
  const applyReferralCode = async (code: string) => {
    try {
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!result.success && result.error) {
        console.warn('Failed to apply referral code:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply referral code:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            intro_session: introSession,
            referral_code: referralCode,
          },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // If user is created and we have an intro session, link it
      if (data.user && introSession) {
        await linkIntroSession(data.user.id, introSession);
      }

      // If user is created and we have a referral code, apply it
      if (data.user && referralCode) {
        await applyReferralCode(referralCode);
      }

      // If we got a session, user is auto-confirmed - redirect to dashboard
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Otherwise, email confirmation is required
      setSuccess(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const callbackParams = new URLSearchParams();
      if (introSession) callbackParams.set('intro_session', introSession);
      if (referralCode) callbackParams.set('ref', referralCode);
      const queryString = callbackParams.toString();
      const redirectTo = `${window.location.origin}/auth/callback${queryString ? `?${queryString}` : ''}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setError('An unexpected error occurred');
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-[#ccf5f7] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[#00e3ec]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Check your email
        </h2>
        <p className="text-gray-500 mb-6">
          We&apos;ve sent a verification link to{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
        <Button
          onClick={() => router.push('/login')}
          className="w-full h-11 bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#1e293b] hover:to-[#334155] text-white font-medium"
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Sign Up Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Start your self-assessment tax return
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Intro session notice */}
          {introSession && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00e3ec]/10 border border-[#00e3ec]/20">
              <Sparkles className="h-4 w-4 text-[#00c4d4] flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Your answers will be used to personalize your experience
              </p>
            </div>
          )}

          {/* Referral code notice */}
          {referralCode && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00e3ec]/10 border border-[#00e3ec]/20">
              <Gift className="h-4 w-4 text-[#00c4d4] flex-shrink-0" />
              <p className="text-sm text-gray-600">
                Referral code <span className="font-mono font-medium">{referralCode}</span> applied -
                you&apos;ll get £{REFERRAL_CONFIG.rewards.self_assessment.referredDiscount} off!
              </p>
            </div>
          )}

          {/* Google OAuth button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-200"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#1e293b] hover:to-[#334155] text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#00c4d4] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6">
        By signing up, you agree to our{' '}
        <a href="https://taxfolio.io/terms" className="underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="https://taxfolio.io/privacy" className="underline">
          Privacy Policy
        </a>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Create your account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Start your self-assessment tax return
            </p>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
