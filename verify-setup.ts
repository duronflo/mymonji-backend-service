#!/usr/bin/env bun

/**
 * Bun Setup Verification Script
 * 
 * This script verifies that Bun is properly installed and configured
 * for the MyMonji Backend Service project.
 */

import { $ } from "bun";

console.log("🔍 MyMonji Backend Service - Bun Setup Verification\n");

// Check Bun version
console.log("📦 Checking Bun installation...");
try {
  const bunVersion = await $`bun --version`.text();
  console.log(`✅ Bun ${bunVersion.trim()} is installed`);
} catch (error) {
  console.error("❌ Bun is not installed or not in PATH");
  console.error("   Install Bun: curl -fsSL https://bun.sh/install | bash");
  process.exit(1);
}

// Check if lockfile exists
console.log("\n📋 Checking dependencies...");
const lockFileExists = await Bun.file("bun.lockb").exists();
if (lockFileExists) {
  console.log("✅ bun.lockb found - dependencies are configured");
} else {
  console.log("⚠️  bun.lockb not found - run 'bun install' first");
}

// Check if node_modules exists
const nodeModulesPackageExists = await Bun.file("node_modules/.package-lock.json").exists() 
  || await Bun.file("node_modules/package-lock.json").exists()
  || await Bun.file("node_modules/.bin").exists();
if (nodeModulesPackageExists) {
  console.log("✅ node_modules directory found");
} else {
  console.log("⚠️  node_modules not found - run 'bun install' to install dependencies");
}

// Check environment files
console.log("\n⚙️  Checking environment configuration...");
const backendEnvExists = await Bun.file("packages/backend/.env").exists();
const frontendEnvExists = await Bun.file("packages/frontend/.env").exists();

if (backendEnvExists) {
  console.log("✅ Backend .env file found");
} else {
  console.log("⚠️  Backend .env not found - copy from .env.example");
}

if (frontendEnvExists) {
  console.log("✅ Frontend .env file found");
} else {
  console.log("⚠️  Frontend .env not found - copy from .env.example");
}

// Check if shared package is built
console.log("\n🔨 Checking build artifacts...");
const sharedDistExists = await Bun.file("packages/shared/dist/index.js").exists();
if (sharedDistExists) {
  console.log("✅ Shared package is built");
} else {
  console.log("⚠️  Shared package not built - run 'cd packages/shared && bun run build'");
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Setup Summary");
console.log("=".repeat(60));

const checks = [
  { name: "Bun installed", passed: true },
  { name: "Dependencies installed", passed: lockFileExists && nodeModulesPackageExists },
  { name: "Environment configured", passed: backendEnvExists && frontendEnvExists },
  { name: "Shared package built", passed: sharedDistExists }
];

let allPassed = true;
checks.forEach(check => {
  const icon = check.passed ? "✅" : "❌";
  console.log(`${icon} ${check.name}`);
  if (!check.passed) allPassed = false;
});

console.log("=".repeat(60));

if (allPassed) {
  console.log("\n🎉 Everything looks good! You're ready to start developing.");
  console.log("\nNext steps:");
  console.log("  1. Start backend:  cd packages/backend && bun run dev");
  console.log("  2. Start frontend: cd packages/frontend && bun run dev");
} else {
  console.log("\n⚠️  Some setup steps are incomplete. Please address the issues above.");
  console.log("\nQuick setup:");
  console.log("  1. bun install");
  console.log("  2. cp packages/backend/.env.example packages/backend/.env");
  console.log("  3. cp packages/frontend/.env.example packages/frontend/.env");
  console.log("  4. cd packages/shared && bun run build");
}

console.log("\n📚 For more information, see BUN_MIGRATION.md");
