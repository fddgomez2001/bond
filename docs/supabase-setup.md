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
3. `supabase/migrations/20261016000000_marketplace.sql` — the order flows: `shops`, `listings`, `cart_items`, `event_bookings`, `orders`, `order_items`, `order_events`, `reviews`, `reports`, the functions that place orders and move them along, their RLS policies, and the public `public-media` bucket for shop logos and listing photos (2 MB, images only).

All three are safe to re-run. If you use the Supabase CLI instead: `npx supabase link --project-ref <ref>`, then `npx supabase db push`.

**Check it worked:** in **Table Editor** you should see `profiles`, `vendor_profiles`, `identity_documents` and the nine marketplace tables, each with RLS enabled. In **Storage** you should see `private-documents` (*private*) and `public-media` (*public*).

> Until the marketplace migration has run, the shop, order and vendor-tool pages still open but show empty lists, and saving a shop shows "Could not find the table 'public.shops'".

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

## 6. Create your admin account

Admins review vendor applications at **/dashboard/admin**. Create one from your own terminal, so the password never appears in code or chat:

```bash
npm run admin:create
```

It asks for an email, your name and a password (hidden while you type; same rules as sign-up: 8+ characters with upper and lower case, a number and a symbol). Then log in at `/login` with that email and password. Running it with the email of an existing account promotes that account instead.

**Reviewing vendors:** open an application to see the vendor's details and documents. Documents load through private links that expire after 10 minutes. Choose **Approve**, **Request resubmission** or **Reject**; notes are required for the last two, and the vendor sees them on their dashboard.

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

## 8. Marketplace checklist (gifts, surprises, event services)

Payments are in **test mode**: nothing is charged, and the payment is recorded as *held by BOND*. Card `4000 0000 0000 0002` always fails, so you can try the "payment unsuccessful → try again" path. GCash, Maya and any other card number succeed.

**Vendor (approved)**
1. `/dashboard/vendor` shows a setup checklist. Open **Shop settings** → name, city, delivery fee, what you offer, logo → **Create my shop**.
2. **Products** → **Add product** → Gift or Surprise, photo, price → **Submit for review**. **Services** → **Add service** → category (choose *Event package* to list inclusions), event types.
3. Each listing shows **Waiting for approval** until an admin approves it. Editing a live listing sends it back for review.

**Admin**
1. **Listing Approvals** → approve, or reject with notes (the vendor sees them and can resubmit).
2. **Orders** shows every order and how much is held, released and refunded. **Reports** lists problems customers reported: refund the customer or release the payment to the shop, with a note.

**Customer**
1. **Gift:** home → *Send a gift* → choose a store → add gifts to the cart (one shop per cart) → checkout (recipient, address, message) → pay → track it in **My Orders**.
2. **Surprise:** *Plan a surprise* → date & time (at least 3 hours ahead) and recipient → choose a surprise → review → pay.
3. **Event services:** *Book event services* → event type → date, time & place (at least 1 day ahead) → a package (preview its inclusions) or *Customize* (tick categories, pick a provider for each) → review → pay → optionally request an appointment with your organizers.
4. When the shop marks an order delivered (or the service completed), confirm it: the payment is released to the shop and you can leave a star rating. *Report a problem* keeps the payment on hold until an admin decides. You can cancel until the shop starts preparing (full refund).

**Vendor orders:** **Orders** → open one → *Start preparing* → *Ready for delivery* → *Delivered* (or *Delivery didn't go through* → *Try delivery again*). Service bookings start with *Confirm booking & appointment*. Declining needs a reason and refunds the customer. **Sales** shows held vs. released money; **Reviews** shows ratings.
