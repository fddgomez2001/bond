#!/usr/bin/env node
/**
 * Creates a BOND admin account, or promotes an existing account to admin.
 *
 *   npm run admin:create
 *   npm run admin:create -- --email you@example.com --first-name Frank --last-name Gomez
 *
 * The password is typed into a hidden prompt (never echoed, never logged).
 * For automation you can pass it in the ADMIN_PASSWORD environment variable.
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local, so run it on your own machine only.
 */
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

// ---------- config ----------
function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
  );
}
const env = { ...loadEnv(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]?.startsWith("--") ? true : all[i + 1] ?? true]);
    return pairs;
  }, []),
);

// ---------- prompts ----------
function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => (rl.close(), resolve(answer.trim()))));
}

function askHidden(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  // Swallow echoed characters while typing the password.
  rl._writeToOutput = (text) => {
    if (!muted || text.includes("\n")) process.stdout.write(muted ? "\n" : text);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

// Same rules as lib/config/features.ts → passwordPolicy.
function passwordProblems(pw) {
  const problems = [];
  if (pw.length < 8) problems.push("at least 8 characters");
  if (pw.length > 72) problems.push("72 characters or fewer");
  if (!/[a-z]/.test(pw)) problems.push("a lowercase letter");
  if (!/[A-Z]/.test(pw)) problems.push("an uppercase letter");
  if (!/\d/.test(pw)) problems.push("a number");
  if (!/[^A-Za-z0-9]/.test(pw)) problems.push("a symbol");
  return problems;
}

async function findUserByEmail(admin, email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

// ---------- main ----------
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const email = String(args.email && args.email !== true ? args.email : await ask("Admin email: ")).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That doesn't look like an email address. BOND logs in with email + password.");
  process.exit(1);
}

const existing = await findUserByEmail(admin, email);
let userId = existing?.id;

if (existing) {
  const confirm = args.yes ? "y" : await ask(`${email} already has an account. Make it an admin? (y/N) `);
  if (confirm.toLowerCase() !== "y") process.exit(0);
} else {
  const firstName = String(args["first-name"] && args["first-name"] !== true ? args["first-name"] : await ask("First name: "));
  const lastName = String(args["last-name"] && args["last-name"] !== true ? args["last-name"] : await ask("Last name: "));

  let password = env.ADMIN_PASSWORD;
  if (!password) {
    if (!process.stdin.isTTY) {
      console.error("Run this in a terminal (or set ADMIN_PASSWORD) so the password can be entered privately.");
      process.exit(1);
    }
    password = await askHidden("Password (hidden): ");
    const again = await askHidden("Repeat password: ");
    if (password !== again) {
      console.error("Passwords don't match.");
      process.exit(1);
    }
  }
  const problems = passwordProblems(password);
  if (problems.length) {
    console.error(`Password needs ${problems.join(", ")}.`);
    process.exit(1);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // admins are created by you, so skip the email step
    user_metadata: { first_name: firstName || null, last_name: lastName || null, account_type: "customer" },
  });
  if (error) {
    console.error("Couldn't create the account:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
}

// The sign-up trigger created a customer profile; promote it.
const { data: updated, error: roleError } = await admin
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", userId)
  .select("id, role")
  .maybeSingle();

if (roleError || !updated) {
  console.error(
    "The account exists but couldn't be made an admin:",
    roleError?.message ?? "no profile row — run the database migrations first.",
  );
  process.exit(1);
}

console.log(`\n✔ ${email} is now a BOND admin. Log in at /login to open the admin dashboard.`);
