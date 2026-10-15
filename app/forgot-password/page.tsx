import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  return (
    <Suspense fallback={<ForgotPasswordFlow />}>
      <ForgotPasswordWithParams searchParams={searchParams} />
    </Suspense>
  );
}

async function ForgotPasswordWithParams({
  searchParams,
}: {
  searchParams: PageProps<"/forgot-password">["searchParams"];
}) {
  const params = await searchParams;
  return <ForgotPasswordFlow linkError={params.error === "link-invalid"} />;
}
