# Supabase setup

Do these once per Supabase project (for example one project for development and one for production).

## 1. Create the project and add keys

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the **Project URL** and the **anon** (or **publishable**) key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copy the **service_role** (or **secret**) key into `SUPABASE_SERVICE_ROLE_KEY`. It is only read on the server, by `lib/supabase/admin.ts`. Vendor registration needs it to store documents.
4. Restart `npm run dev` after editing `.env.local`.

## 2. Run the migrations

Open **SQL Editor** and run these files in order (copy, paste, Run):

1. `supabase/migrations/20261015000000_phase1_profiles.sql` — creates `profiles`, `vendor_profiles`, `identity_documents`, the sign-up trigger, column grants, and RLS policies.
2. `supabase/migrations/20261015000100_private_documents_storage.sql` — creates the private `private-documents` bucket (2 MB per file; JPG, PNG, WebP and PDF only) and its read policies.

Both are safe to re-run. If you use the Supabase CLI instead: `npx supabase link --project-ref <ref>`, then `npx supabase db push`.

**Check it worked:** in **Table Editor** you should see the three tables, each with RLS enabled. In **Storage** you should see `private-documents`, marked *private*.

## 3. Auth settings

**Authentication → Sign In / Providers → Email**

- Email provider: **enabled**.
- **Confirm email: ON** (recommended). When it's on, sign-up shows the code screen. When it's off, users are signed in right after sign-up; the app supports both.
- **Email OTP length: 6** (the app's code boxes expect 6 digits).
- Password requirements: minimum length **8**, and require lowercase, uppercase, digits and symbols, to match `passwordPolicy` in `lib/config/features.ts`.

**Authentication → URL Configuration**

- **Site URL:** `http://localhost:3000` for development, `https://your-domain.com` in production.
- **Redirect URLs** — add every address the app runs on, **including each local port you use**:
  - `http://localhost:3000/**` (`npm run dev`)
  - `http://localhost:8713/**` (`npx next start -p 8713`)
  - `https://your-domain.com/**`
  - optional, for Vercel previews: `https://*-<your-vercel-team>.vercel.app/**`

When the app runs on `localhost`, email links automatically use the port it's running on. Supabase only honours that port if it's in this list; otherwise it falls back to the Site URL.

## 4. Email templates (adds the 6-digit code)

The default emails contain only a link. BOND's flow (from the process diagram) asks for a code, so update **Authentication → Emails → Templates**. Each template includes both the code and a link that works in any browser. The link uses `{{ .RedirectTo }}`, the address the app sent with the request, so it points to whichever port or domain you signed up on. That address already contains `?next=…`, which is why the rest is joined with `&`.

**Confirm signup**

```html
<h2>Confirm your BOND account</h2>
<p>Enter this code to verify your email:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Or click the link below:</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Verify my email</a></p>
<p>If you didn't sign up for BOND, you can ignore this email.</p>
```

**Reset password** (only needed once password recovery is switched on)

```html
<h2>Reset your BOND password</h2>
<p>Enter this code to continue:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>Or click the link below:</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Reset my password</a></p>
<p>If you didn't ask for this, you can ignore this email — your password won't change.</p>
```

## 5. Email delivery (SMTP)

Supabase's built-in mailer is for testing only: it **only delivers to email addresses of your Supabase project's team members** and sends just a few emails per hour.

Until you set up SMTP (Authentication → Emails → SMTP Settings — for example Gmail with an app password, Resend, or SendGrid), pick one:

- **Test with a team member's email address.** The code emails will arrive.
- **Turn "Confirm email" off** for the development project. Sign-up then signs users in immediately and skips the code screen.

Password recovery stays a **static preview** until you set `NEXT_PUBLIC_ENABLE_PASSWORD_RECOVERY=true` (it needs working email). The live code is already written but has not been tested yet.

## Troubleshooting

**"This site can't be reached" after clicking the email link.** The link points to the address you signed up on (for example `http://localhost:8713`). That only works while the app is still running on that port, on the same computer. Opening the email on your phone sends the phone to *its own* localhost. If the link still shows the wrong port, add that port to **Redirect URLs** (step 3). If you use `next start`, run `npm run build` again after changing code or `.env.local`.

**`error_code=otp_expired` in the URL.** The link was already used, or a newer email replaced it ("Resend code" and signing up again both issue new links). Links work once. If you clicked it before, the email is already verified: just log in. To check, look at the user in **Authentication → Users**; a verified user has a "Confirmed at" date.

**Your email has a link but no 6-digit code.** You're still on Supabase's default template. Apply step 4.

**After logging in: "We couldn't load your profile".** The migrations haven't been run. Run both (step 2). The first one also creates profiles for accounts that already existed.

## 6. Make an admin (optional)

Admins can read all profiles and documents and change review status. There's no admin UI yet; review vendors in the Table Editor or SQL. To promote a user:

```sql
update public.profiles set role = 'admin' where id = '<user uuid from Authentication → Users>';
```

Approve a vendor:

```sql
update public.vendor_profiles
set business_verification_status = 'approved', reviewed_at = now()
where user_id = '<vendor user uuid>';
```

## 7. Testing checklist

Run `npm run dev` and work through these.

**Customer registration**
1. `/signup` → Customer. Submit an empty form: each field shows its own error. Try an under-18 birthdate, letters in the phone number, a weak password, and mismatched passwords.
2. Complete the form → **Create account** → you land on `/verify-email` with your masked email.
3. Enter the 6-digit code from the email (or click the link). You arrive at `/dashboard/customer` with "You're all set!".
4. In **Table Editor → profiles**, the new row has `role = customer` and your details.

**Vendor registration**
1. `/signup/vendor` → fill in personal info → upload a selfie, a government ID (image or PDF), and proof of business. Try a non-image file renamed to `.png`: it's rejected. Replace and remove both work.
2. Create a password → **Submit registration**. The progress bar shows the upload.
3. Verify the code → `/dashboard/vendor` shows **pending review**, with all three documents marked *Received*.
4. Check **Storage → private-documents → <user id>/** for the three files, and **vendor_profiles** for their paths and `pending_review`.
5. Approve the vendor with the SQL above and refresh: the status shows approved.

**Login / logout**
1. `/login` with a wrong password shows "Incorrect email or password." (it doesn't say whether the email exists).
2. Log in as a customer → `/dashboard/customer`. As a vendor → `/dashboard/vendor`.
3. Log in with an unverified account → you're sent to `/verify-email`.
4. While signed in, visit `/login`: you're redirected to your dashboard. Visit the other role's dashboard: you're redirected to your own.
5. Account menu (top right) → **Log out** → `/login` shows "You've been signed out." Visiting `/dashboard/customer` now redirects to `/login`.
6. Untick **Keep me signed in**, log in, fully close the browser, and reopen it: you're signed out.

**Email verification**
- A wrong code shows an error. After 5 wrong codes the form asks you to request a new code.
- **Resend code** is disabled for 60 seconds.

**Password recovery (static preview)**
- `/forgot-password` → any email → any 6 digits → new password. It ends with "your password has not been changed". No email is sent.

**Security spot checks** (SQL Editor → *Run as* → choose an authenticated user, or test through the API)
- `update public.profiles set role = 'admin' where id = auth.uid();` as a normal user → **permission denied**.
- `update public.vendor_profiles set business_verification_status = 'approved';` as a vendor → **permission denied** (or 0 rows).
- Reading another user's profile row returns nothing.
