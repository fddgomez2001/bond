# Deploying BOND to Vercel

Nothing deploys automatically. Follow these steps when you're ready.

## Local vs production

| | Local development | Production (Vercel) |
| --- | --- | --- |
| Env file | `.env.local` (git-ignored) | Vercel → Project → Settings → Environment Variables |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://your-domain.com` |
| Supabase project | dev project (Confirm email may be off) | separate production project, Confirm email **on**, custom SMTP |
| Supabase Site URL | `http://localhost:3000` | `https://your-domain.com` |
| Error messages | include setup hints ("add SUPABASE_SERVICE_ROLE_KEY…") | generic, no internals |

## 1. Import the project

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repo. The framework is detected as Next.js. Keep the default build command (`next build`) and output settings.

## 2. Environment variables

Add these for **Production** (and **Preview** if you use preview deployments, ideally pointing at a non-production Supabase project):

| Name | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | |
| `SUPABASE_SERVICE_ROLE_KEY` | service role / secret key | Server only. Don't add it to any `NEXT_PUBLIC_` variable. Mark it **Sensitive**. |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Used in email links. If left unset, Vercel's production URL is used. |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RECOVERY` | `false` until SMTP works | |

`NEXT_PUBLIC_*` values are built into the JavaScript bundle, so **redeploy after changing them**.

## 3. Domain

1. Vercel → Project → **Settings → Domains** → add `your-domain.com` (and `www.` if you want it).
2. Add the DNS records Vercel shows (an `A` record for the apex domain, a `CNAME` for `www`) at your DNS provider, and wait for the certificate to be issued.
3. Set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy.
4. In Supabase **Authentication → URL Configuration**, set **Site URL** to the domain and add `https://your-domain.com/**` to **Redirect URLs**.

## 4. Pre-launch checklist

- [ ] Both SQL migrations have been run on the **production** Supabase project.
- [ ] Storage bucket `private-documents` exists and is **private**.
- [ ] Auth: Confirm email **on**, OTP length 6, password rules match the app.
- [ ] Email templates updated with `{{ .Token }}` (see `docs/supabase-setup.md`).
- [ ] Custom SMTP configured (the built-in mailer won't email real users).
- [ ] Site URL and Redirect URLs set to the production domain.
- [ ] All environment variables set in Vercel; service role key marked Sensitive.
- [ ] `npm run build` passes locally.
- [ ] Placeholder content replaced or approved: contact details, social links, legal pages, demo events, sample pricing, team section, minimum age.
- [ ] Test the full flow on the deployed URL: customer sign-up → code → dashboard, vendor sign-up with documents, log out, log in.

## Platform limits to know

- **Request body: 4.5 MB** per Vercel function. Vendor images are resized in the browser and the total upload is capped at 4 MB (`lib/config/uploads.ts`). If you later need large PDFs, switch to signed direct-to-Storage uploads.
- **Rate limiting:** the in-memory limiter is per instance. Supabase Auth's own limits still apply (Authentication → Rate Limits). For a shared limit, add Upstash Redis.
