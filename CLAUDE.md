# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is currently a stub. Beyond `README.md` and `.gitignore`, there is no source code, build configuration, package manifest, or test setup checked in yet. The README states only that the project is "An interactive museum guide application."

Because nothing has been built yet, there are no real build / lint / test commands to document. Do not invent or assume tooling — verify what is actually present before running commands or claiming a stack.

## Intended stack (inferred from `.gitignore` only)

The `.gitignore` ignores `node_modules/`, npm/yarn/pnpm debug logs, and the build outputs `dist/`, `build/`, `.next/`, `.turbo/`, `.vercel/`. This suggests the project is expected to be a Node.js codebase, likely Next.js deployed to Vercel and possibly using Turborepo. Treat this as a hint about intent, not a confirmed architecture — the actual stack is whatever the first contributor scaffolds.

## Conventions for early contributions

- When scaffolding the project for the first time, update this file with the real commands (install, dev server, build, lint, single-test invocation) and the high-level architecture once it exists.
- The development branch for this task is `claude/add-claude-documentation-t7Sim`. The default branch is `main`.
- Environment files (`.env`, `.env.*`) are gitignored except `.env.example`; commit a `.env.example` whenever new environment variables are introduced.
