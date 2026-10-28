# Graph Report - Devint_AI  (2026-10-28)

## Corpus Check
- 74 files · ~31,257 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 5, .css 3, .mdc 1)

## Summary
- 502 nodes · 834 edges · 33 communities (23 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `42ac682b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/package.json
- ui/package.json
- api/package.json
- compilerOptions
- compilerOptions
- components.json
- compilerOptions
- scripts
- conor-face.tsx
- db
- eslint.config.mjs
- auth.ts
- context7
- server.ts
- postcss.config.mjs
- pnpm-workspace.yaml
- compilerOptions
- password-policy.ts
- dependencies
- Сторонние списки
- layout.tsx
- scripts
- handoff.sh
- throttle.ts
- offer-draft-1.md
- privacy-draft-1.md

## God Nodes (most connected - your core abstractions)
1. `registerAuthRoutes()` - 38 edges
2. `getDatabase()` - 18 edges
3. `RegisterForm()` - 17 edges
4. `compilerOptions` - 16 edges
5. `compilerOptions` - 13 edges
6. `readApiConfig()` - 12 edges
7. `startApi()` - 10 edges
8. `scripts` - 9 edges
9. `scripts` - 8 edges
10. `drizzle-orm` - 8 edges

## Surprising Connections (you probably didn't know these)
- `HomePage()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/page.tsx → packages/ui/src/components/button.tsx
- `HomePage()` --calls--> `ConorFace()`  [EXTRACTED]
  apps/web/src/app/page.tsx → packages/ui/src/conor-face.tsx
- `RegisterForm()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/register/register-form.tsx → packages/ui/src/components/button.tsx
- `RegisterForm()` --calls--> `Checkbox()`  [EXTRACTED]
  apps/web/src/app/register/register-form.tsx → packages/ui/src/components/checkbox.tsx
- `RegisterForm()` --calls--> `Dialog()`  [EXTRACTED]
  apps/web/src/app/register/register-form.tsx → packages/ui/src/components/dialog.tsx

## Import Cycles
- None detected.

## Communities (33 total, 10 thin omitted)

### Community 0 - "web/package.json"
Cohesion: 0.13
Nodes (20): devDependencies, eslint@^9, eslint-config-next@^15.5.7, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^22, @types/react@^19, @types/react-dom@^19 (+12 more)

### Community 1 - "ui/package.json"
Cohesion: 0.07
Nodes (35): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.62.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-slot@^1.2.3, tailwind-merge@^3.3.1, devDependencies (+27 more)

### Community 2 - "api/package.json"
Cohesion: 0.06
Nodes (43): drizzleConfig, dependencies, drizzle-orm@^0.45.4, fastify@^5.12.7, @fastify/cookie@^11.1.5, @fastify/cors@^11.3.1, @fastify/helmet@^13.2.0, @fastify/rate-limit@^11.2.1 (+35 more)

### Community 3 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, module, moduleResolution, noEmit, outDir, rootDir, extends (+2 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 5 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noEmit (+5 more)

### Community 7 - "scripts"
Cohesion: 0.11
Nodes (18): engines, node, name, postcss, packageManager, pnpm, overrides, private (+10 more)

### Community 8 - "conor-face.tsx"
Cohesion: 0.06
Nodes (48): clampUnit(), faceGazes, faceStates, HomePage(), onPointerMove(), readLegal(), RegisterPage(), RegisterForm() (+40 more)

### Community 9 - "db"
Cohesion: 0.17
Nodes (11): environment, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, services (+3 more)

### Community 10 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 11 - "auth.ts"
Cohesion: 0.05
Nodes (67): NodeEnv, alreadyRegisteredLetter(), createEmailToken(), EmailToken, hashEmailToken(), MailLetter, passwordChangedLetter(), resetPasswordLetter() (+59 more)

### Community 12 - "context7"
Cohesion: 0.33
Nodes (5): context7, graphify, npx, /Users/Vladimir/.local/bin/graphify-mcp, @upstash/context7-mcp

### Community 13 - "server.ts"
Cohesion: 0.18
Nodes (20): startAccountCleanup(), isMailMode(), isNodeEnv(), MailMode, mailModeValues, nodeEnvValues, readApiConfig(), readApiHost() (+12 more)

### Community 16 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, jsx, lib, paths, extends, include, ../../config/tsconfig.base.json

### Community 19 - "password-policy.ts"
Cohesion: 0.15
Nodes (14): applyLookalikes(), birthDateForms(), dataDirectory, isListedPassword(), isRepeatedCharacter(), isSimpleSequence(), loadPasswordLists(), readPasswordFile() (+6 more)

### Community 20 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @devint_ai/ui@workspace:*, react@19.1.0, react-dom@19.1.0, react, react-dom, @devint_ai/ui

### Community 22 - "layout.tsx"
Cohesion: 0.25
Nodes (5): next@^15.5.7, metadata, montserrat, viewport, next

### Community 23 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

### Community 24 - "handoff.sh"
Cohesion: 0.52
Nodes (6): filter_stat(), is_blocked_path(), is_sensitive_key(), report_secret(), handoff.sh script, TZ

### Community 25 - "throttle.ts"
Cohesion: 0.10
Nodes (32): CleanupLog, runAccountCleanup(), getDatabase(), authEvents, emailTokens, legalAcceptances, loginFailures, mailEvents (+24 more)

### Community 26 - "offer-draft-1.md"
Cohesion: 0.33
Nodes (5): Возврат, Общие положения, Ограничения сервиса, Порядок оплаты и сроки, Предмет

### Community 27 - "privacy-draft-1.md"
Cohesion: 0.33
Nodes (5): Какие данные собираются, Контакты, Права пользователя, Хранение, Цели

## Knowledge Gaps
- **6 isolated node(s):** `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp`, `../../config/tsconfig.base.json`, `../../config/tsconfig.base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `layout.tsx` to `web/package.json`, `conor-face.tsx`, `password-policy.ts`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `throttle.ts` to `api/package.json`, `auth.ts`, `server.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `ui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07301587301587302 - nodes in this community are weakly interconnected._
- **Should `api/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.060129509713228495 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._