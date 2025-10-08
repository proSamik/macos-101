#!/usr/bin/env node

/**
 * Post-install script for production deployment
 * Runs database migrations when in Vercel environment
 * Optimized for Vercel deployment with Neon.com database
 */

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Environment detection
const IS_VERCEL_ENV = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
const NODE_ENV = process.env.NODE_ENV;

async function runCommand(command: string, description: string) {
  console.log(`🚀 Starting: ${description}`);
  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      env: process.env,
    });

    console.log(`📊 ${description} output:`);
    console.log(stdout);

    if (stderr) {
      console.error(`⚠️ ${description} stderr:`);
      console.error(stderr);
    }
    console.log(`✅ ${description} finished successfully.`);
  } catch (error: any) {
    console.error(`❌ ${description} error:`, error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Running post-install script...');
  console.log(`📊 NODE_ENV: ${NODE_ENV}`);
  console.log(`📊 VERCEL_ENV: ${process.env.VERCEL_ENV}`);
  console.log(`📊 IS_VERCEL: ${process.env.VERCEL}`);

  if (IS_VERCEL_ENV) {
    console.log("🌍 Running on Vercel, performing database migration.");
    await runCommand("pnpm db:generate", "Database migration files generation");
    await runCommand("pnpm db:migrate", "Database schema migration");
    console.log('🎉 Post-install script completed successfully!');
  } else {
    console.log("🔧 Development environment - skipping database migrations");
    console.log("💡 To run migrations manually, use: pnpm db:generate && pnpm db:migrate");
  }
}

main();