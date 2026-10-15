import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthAsideIntro, AuthFormHeader, AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { buttonClasses } from "@/components/ui/button";
import { FormSkeleton } from "@/components/ui/loading-state";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      aside={
        <div className="flex h-full flex-col gap-5 lg:gap-8">
          <AuthAsideIntro eyebrow="Welcome back" title="Good to see you again!">
            Log in to discover events, manage your account, and stay connected with the BOND
            community.
          </AuthAsideIntro>
          {/* Phones already get "Create an account" under the form. */}
          <div className="hidden space-y-3 lg:block">
            <p className="text-sm text-white/70">Don&apos;t have an account yet?</p>
            <Link
              href="/signup"
              className={buttonClasses({
                variant: "outline-light",
                size: "md",
                className: "transition-all duration-300 ease-smooth hover:-translate-y-0.5",
              })}
            >
              Sign up
            </Link>
          </div>
        </div>
      }
    >
      <AuthFormHeader title="Log in" description="Enter the email and password for your BOND account." />
      <Suspense fallback={<FormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginFormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  return <LoginForm next={pick("next")} status={pick("status")} configured={isSupabaseConfigured()} />;
}
