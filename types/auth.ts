/** Shape returned by server actions and the registration endpoints. */
export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type RegistrationResponse =
  | { ok: true; next: "verify-email" | "dashboard"; redirectTo: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };
