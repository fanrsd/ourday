// Creates the database, the least-privileged app role, and applies the schema.
// Idempotent: safe to run repeatedly. `--reset` drops the database first.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { loadEnv } from "../lib/env.ts";
import { sql } from "../lib/db.ts";
import { seedTemplateDemos } from "./seed-templates.ts";

loadEnv();

const ADMIN = process.env.ADMIN_DATABASE_URL ?? "postgres://postgres@localhost:5432/postgres";
const DB_NAME = process.env.DB_NAME ?? "ourday";
const APP_ROLE = process.env.DB_APP_ROLE ?? "ourday_app";
const APP_PASSWORD = process.env.DB_APP_PASSWORD ?? "ourday";
const reset = process.argv.includes("--reset");

const admin = postgres(ADMIN, { max: 1, onnotice: () => {} });

if (reset) {
  await admin.unsafe(`drop database if exists ${DB_NAME} with (force)`);
  console.log(`dropped ${DB_NAME}`);
}

const [existing] = await admin`select 1 from pg_database where datname = ${DB_NAME}`;
if (!existing) {
  await admin.unsafe(`create database ${DB_NAME}`);
  console.log(`created ${DB_NAME}`);
}

const [role] = await admin`select 1 from pg_roles where rolname = ${APP_ROLE}`;
if (!role) {
  await admin.unsafe(`create role ${APP_ROLE} login password '${APP_PASSWORD}'`);
  console.log(`created role ${APP_ROLE}`);
}
await admin.end();

const dbUrl = new URL(ADMIN);
dbUrl.pathname = `/${DB_NAME}`;
const db = postgres(dbUrl.toString(), { max: 1, onnotice: () => {} });

const [applied] = await db`select to_regclass('public.users') as t`;
if (!applied.t) {
  await db.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("applied schema");
} else {
  console.log("schema already present");
}

// Everything in here is create-or-replace, so it is re-applied every run and a
// change to a definer function ships without a database reset.
await db.unsafe(readFileSync(new URL("../db/002_privileged.sql", import.meta.url), "utf8"));
console.log("applied privileged functions");

// The app role owns nothing, so RLS binds to it. Blanket table grants are safe:
// a table with RLS on and no matching policy denies access regardless of grant.
await db.unsafe(`
  grant connect on database ${DB_NAME} to ${APP_ROLE};
  grant usage on schema public to ${APP_ROLE};
  grant select, insert, update, delete on all tables in schema public to ${APP_ROLE};
  grant execute on all functions in schema public to ${APP_ROLE};
  alter default privileges in schema public
    grant select, insert, update, delete on tables to ${APP_ROLE};
`);
console.log(`granted to ${APP_ROLE}`);

await db.end();

// The /desain gallery links to /u/demo-<template>. If nothing creates those
// invitations the storefront ships five dead links — which is exactly what
// happened, because the page that links them and the code that renders them had
// two different owners and neither owned the data. Seeding here means a fresh
// database cannot reach production with a broken gallery, and it runs before any
// server is up, so no request ever caches a 404 for those slugs.
await seedTemplateDemos();
await sql.end();
