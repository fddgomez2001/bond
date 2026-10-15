import type { Metadata } from "next";
import Link from "next/link";
import { AuthAsideIntro, AuthFormHeader, AuthShell } from "@/components/auth/auth-shell";
import { RoleSelection } from "@/components/auth/role-selection";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthShell
      aside={
        <AuthAsideIntro eyebrow="Be part of BOND" title="Let's get you started">
          Choose the account that fits you. Customers can start right after verifying their email;
          vendors submit business documents for review first.
        </AuthAsideIntro>
      }
    >
      <AuthFormHeader title="Create an account" description="How will you use BOND?" />
      <RoleSelection />
      <p className="mt-8 text-center text-sm text-bond-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-bond-slate underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
