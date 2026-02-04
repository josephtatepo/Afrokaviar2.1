import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Apple, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function SocialButton({
  icon,
  label,
  testId,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  testId: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={`h-11 w-full justify-start gap-3 border border-white/10 ${disabled ? 'bg-white/[0.02] text-white/30 cursor-not-allowed' : 'bg-white/5 text-white hover:bg-white/10'}`}
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className={disabled ? "text-white/20" : "text-white/80"}>{icon}</span>
      <span className="text-sm">{label}</span>
      {disabled && <span className="ml-auto text-[10px] uppercase tracking-wider text-white/20">Coming Soon</span>}
    </Button>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const title = useMemo(
    () => (mode === "signin" ? "Sign in" : "Create your account"),
    [mode],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:py-16">
        <div className="absolute inset-0 -z-10 opacity-[0.20] [background-image:radial-gradient(700px_400px_at_20%_10%,rgba(34,211,238,.25),transparent),radial-gradient(700px_400px_at_80%_30%,rgba(245,158,11,.18),transparent)]" />

        <div className="flex flex-col justify-between gap-10">
          <div>
            <Link href="/" data-testid="link-auth-back">
              <span className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back
              </span>
            </Link>
            <h1
              className="mt-5 font-display text-4xl tracking-[-0.02em] text-white"
              data-testid="text-auth-title"
            >
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/65" data-testid="text-auth-subtitle">
              Sign in with your favorite social account to get started.
            </p>
          </div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Card className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white shadow-xl backdrop-blur-md">
            <div className="grid gap-3">
              <SocialButton
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
                label="Continue with Google"
                testId="button-auth-google"
                onClick={() => window.location.href = "/api/auth/google"}
              />
              <SocialButton
                icon={<Apple className="h-4 w-4" />}
                label="Continue with Apple"
                testId="button-auth-apple"
                onClick={() => {}}
                disabled
              />
              <SocialButton
                icon={<XIcon className="h-4 w-4" />}
                label="Continue with X"
                testId="button-auth-x"
                onClick={() => {}}
                disabled
              />
              <SocialButton
                icon={<FacebookIcon className="h-4 w-4" />}
                label="Continue with Facebook"
                testId="button-auth-facebook"
                onClick={() => {}}
                disabled
              />

              <div className="text-xs text-white/55" data-testid="text-auth-terms">
                By continuing, you agree to the Terms and confirm you’ve read the Privacy Policy.
              </div>

              <div className="pt-2 text-sm text-white/70">
                {mode === "signin" ? (
                  <button
                    type="button"
                    className="text-white/70 hover:text-white underline underline-offset-4"
                    data-testid="button-auth-switch-signup"
                    onClick={() => setMode("signup")}
                  >
                    New here? Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-white/70 hover:text-white underline underline-offset-4"
                    data-testid="button-auth-switch-signin"
                    onClick={() => setMode("signin")}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
