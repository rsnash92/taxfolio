'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Turnstile, type TurnstileRef } from '@/components/ui/turnstile';
import { Loader2, Check } from 'lucide-react';

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Verify Turnstile token if site key is configured
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the security check');
      setLoading(false);
      return;
    }

    // Verify token server-side if we have one
    if (turnstileToken) {
      try {
        const verifyResponse = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          setError('Security verification failed. Please try again.');
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setLoading(false);
          return;
        }
      } catch {
        setError('Security verification failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  const features = [
    'Optimised for sole traders',
    'Clear guidance all the way',
    'Submit directly to HMRC with a click',
    'Built by experienced accountants',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Logo - Mobile only */}
        <div className="p-6 md:hidden">
          <Image
            src="/taxfolio.png"
            alt="TaxFolio"
            width={140}
            height={35}
            className="h-9 w-auto"
          />
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left side - Marketing copy */}
          <div className="md:w-5/12 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 md:p-10">
            {/* Logo - Desktop */}
            <div className="hidden md:block mb-10">
              <Image
                src="/taxfolio-white.png"
                alt="TaxFolio"
                width={120}
                height={30}
                className="h-7 w-auto"
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Simple and Speedy Tax Returns
            </h1>

            <p className="text-gray-300 mb-6">
              A streamlined Self Assessment designed for sole traders, with built-in HMRC submission.
            </p>

            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00c4d4]/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-[#00c4d4]" />
                  </span>
                  <span className="text-gray-200">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right side - Login form */}
          <div className="md:w-7/12 p-8 md:p-10">
            <div className="max-w-sm mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sign in to continue your tax return
                </p>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Google OAuth button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-gray-200 bg-white text-gray-900 hover:!bg-gray-900 hover:!text-white hover:!border-gray-900"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-600" />
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

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-[#00c4d4] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  {/* Cloudflare Turnstile */}
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      onSuccess={setTurnstileToken}
                      onError={() => setTurnstileToken(null)}
                      onExpire={() => setTurnstileToken(null)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#1e293b] hover:to-[#334155] text-white font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-[#00c4d4] hover:underline font-medium">
                    Create one
                  </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-2">
                  By signing in, you agree to our{' '}
                  <a href="https://taxfolio.io/terms" className="underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="https://taxfolio.io/privacy" className="underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
