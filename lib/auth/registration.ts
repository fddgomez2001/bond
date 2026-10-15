import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MAX_TOTAL_UPLOAD_BYTES,
  PRIVATE_DOCUMENTS_BUCKET,
  documentTypes,
  formatBytes,
  type DocumentType,
} from "@/lib/config/uploads";
import { validateUpload, type ValidatedFile } from "@/lib/security/file-validation";
import { checkRateLimit, rateLimits, tooManyAttemptsMessage } from "@/lib/security/rate-limit";
import { appOrigin, getClientIp, isSameOrigin } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationResponse } from "@/types/auth";
import { setFlash } from "@/lib/flash";
import { authErrorMessage, notConfiguredMessage } from "./errors";
import { setPendingVerification } from "./pending-verification";
import { dashboardPathFor } from "./routes";

const isDev = process.env.NODE_ENV !== "production";

type Role = "customer" | "vendor";

type PersonalInfo = {
  firstName: string;
  lastName: string;
  birthdate: string;
  contactNumber: string;
  email: string;
  password: string;
};

type DocumentRule = { type: DocumentType; required: boolean };

type RegistrationConfig = {
  role: Role;
  schema: z.ZodType<PersonalInfo>;
  documents: DocumentRule[];
};

function json(body: RegistrationResponse, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const TEXT_FIELDS = [
  "firstName",
  "lastName",
  "birthdate",
  "contactNumber",
  "email",
  "password",
  "confirmPassword",
] as const;

/**
 * Shared POST handler for /api/auth/register/{customer,vendor}.
 *
 * Order matters for partial failures:
 *   1. validate every field and file before anything is created;
 *   2. create the auth user — a database trigger creates the profile (and
 *      vendor record) in the same transaction, with the role it derives
 *      server-side;
 *   3. upload documents to the private bucket with the service-role client;
 *   4. if step 3 fails, delete what was uploaded and the new user, so the
 *      person can simply try again.
 */
export async function handleRegistration(request: Request, config: RegistrationConfig) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: "Invalid request origin." }, 403);
  }
  if (!isSupabaseConfigured()) {
    return json({ ok: false, message: notConfiguredMessage }, 503);
  }

  const limit = checkRateLimit(`register:ip:${getClientIp(request.headers)}`, rateLimits.register);
  if (!limit.allowed) {
    return json({ ok: false, message: tooManyAttemptsMessage(limit.retryAfterSeconds) }, 429);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, message: "We couldn't read the form. Please try again." }, 400);
  }

  // 1a. Text fields
  const values = Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  const parsed = config.schema.safeParse(values);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        message: "Please fix the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      },
      400,
    );
  }
  const data = parsed.data;

  // 1b. Files
  const files: { type: DocumentType; file: ValidatedFile }[] = [];
  const fileErrors: Record<string, string[]> = {};
  for (const rule of config.documents) {
    const definition = documentTypes[rule.type];
    const result = await validateUpload(formData.get(rule.type), {
      label: definition.label,
      accept: definition.accept,
      required: rule.required,
    });
    if (result.error) fileErrors[rule.type] = [result.error];
    else if (result.file) files.push({ type: rule.type, file: result.file });
  }
  if (Object.keys(fileErrors).length > 0) {
    return json({ ok: false, message: "Please check your documents.", fieldErrors: fileErrors }, 400);
  }
  const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
    return json(
      {
        ok: false,
        message: `Your documents add up to ${formatBytes(totalBytes)}. Keep the total under ${formatBytes(MAX_TOTAL_UPLOAD_BYTES)}.`,
      },
      413,
    );
  }

  // 1c. Uploads need the service-role client and the private bucket.
  const admin = files.length > 0 ? createAdminClient() : null;
  if (files.length > 0) {
    if (!admin) {
      return json(
        {
          ok: false,
          message: isDev
            ? "Document upload needs SUPABASE_SERVICE_ROLE_KEY in .env.local (server only)."
            : "Registration with documents is temporarily unavailable. Please try again later.",
        },
        503,
      );
    }
    const { error: bucketError } = await admin.storage.getBucket(PRIVATE_DOCUMENTS_BUCKET);
    if (bucketError) {
      return json(
        {
          ok: false,
          message: isDev
            ? `Storage bucket "${PRIVATE_DOCUMENTS_BUCKET}" was not found. Run the storage migration in supabase/migrations.`
            : "Registration with documents is temporarily unavailable. Please try again later.",
        },
        503,
      );
    }
  }

  // 2. Create the account. The role in metadata is only a request: the
  //    database trigger accepts "customer" or "vendor" and nothing else.
  const supabase = await createClient();
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${appOrigin(request.headers)}/auth/confirm?next=/dashboard`,
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        birthdate: data.birthdate,
        contact_number: data.contactNumber,
        account_type: config.role,
      },
    },
  });

  if (signUpError || !signUp.user) {
    const exists =
      signUpError?.code === "user_already_exists" || signUpError?.code === "email_exists";
    return json(
      {
        ok: false,
        message: exists
          ? "We couldn't create an account with this email. If you already have one, log in instead."
          : authErrorMessage(signUpError, "We couldn't create your account. Please try again."),
      },
      exists ? 409 : 400,
    );
  }

  const user = signUp.user;

  // With email confirmation on, Supabase answers a sign-up for an existing
  // email with a placeholder user that has no identities and sends nothing.
  // Show the same "check your email" screen so the response can't be used
  // to discover accounts, and never touch storage for it.
  const isExistingAccount = Array.isArray(user.identities) && user.identities.length === 0;

  if (!isExistingAccount && files.length > 0 && admin) {
    const stored = new Map<DocumentType, string>();
    let failed = false;

    for (const { type, file } of files) {
      // The path is built only from server-side values.
      const path = `${user.id}/${type}-${Date.now()}.${file.extension}`;
      const { error } = await admin.storage
        .from(PRIVATE_DOCUMENTS_BUCKET)
        .upload(path, file.bytes, { contentType: file.mimeType, upsert: false });
      if (error) {
        failed = true;
        break;
      }
      stored.set(type, path);
    }

    if (!failed) {
      const pathFor = (type: DocumentType) => stored.get(type) ?? null;

      if (config.role === "vendor") {
        const { error } = await admin
          .from("vendor_profiles")
          .update({
            selfie_path: pathFor("selfie"),
            government_id_path: pathFor("government_id"),
            proof_of_business_path: pathFor("proof_of_business"),
            submitted_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        failed = Boolean(error);
      } else {
        const governmentId = pathFor("government_id");
        if (governmentId) {
          const { error } = await admin.from("identity_documents").insert({
            user_id: user.id,
            document_type: "government_id",
            storage_path: governmentId,
          });
          failed = Boolean(error);
        }
      }
    }

    if (failed) {
      if (stored.size > 0) await admin.storage.from(PRIVATE_DOCUMENTS_BUCKET).remove([...stored.values()]);
      if (signUp.session) await supabase.auth.signOut();
      await admin.auth.admin.deleteUser(user.id);
      return json(
        {
          ok: false,
          message: "We couldn't save your documents, so nothing was created. Please try again.",
        },
        500,
      );
    }
  }

  // Email confirmation is off in Supabase → the user is already signed in.
  if (signUp.session) {
    await setFlash("account-created");
    return json({ ok: true, next: "dashboard", redirectTo: `${dashboardPathFor(config.role)}?welcome=1` });
  }

  await setPendingVerification({ email: data.email, role: config.role });
  return json({ ok: true, next: "verify-email", redirectTo: "/verify-email" });
}
