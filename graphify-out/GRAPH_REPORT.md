# Graph Report - Devint_AI  (2026-10-29)

## Corpus Check
- 81 files · ~34,677 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 5, .css 3, .mdc 1)

## Summary
- 542 nodes · 937 edges · 38 communities (28 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4418a8b4`
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
- session.ts
- auth.ts
- context7
- server.ts
- postcss.config.mjs
- pnpm-workspace.yaml
- compilerOptions
- password-policy.ts
- cleanup.ts
- Сторонние списки
- conor-face.tsx
- eslint.config.mjs
- handoff.sh
- throttle.ts
- offer-draft-1.md
- privacy-draft-1.md
- auth-stage.tsx
- next
- dependencies
- scripts
- middleware.ts

## God Nodes (most connected - your core abstractions)
1. `registerAuthRoutes()` - 38 edges
2. `getDatabase()` - 18 edges
3. `RegisterForm()` - 18 edges
4. `compilerOptions` - 16 edges
5. `compilerOptions` - 13 edges
6. `readApiConfig()` - 12 edges
7. `Button` - 12 edges
8. `startApi()` - 10 edges
9. `emailError()` - 10 edges
10. `LoginForm()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `HomePage()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/page.tsx → packages/ui/src/components/button.tsx
- `LoginForm()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/button.tsx
- `LoginForm()` --calls--> `Input`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/input.tsx
- `LoginForm()` --calls--> `PasswordInput`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/password-input.tsx
- `ResetRequestForm()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/(auth)/login/reset-request-form.tsx → packages/ui/src/components/button.tsx

## Import Cycles
- None detected.

## Communities (38 total, 10 thin omitted)

### Community 0 - "web/package.json"
Cohesion: 0.13
Nodes (20): devDependencies, eslint@^9, eslint-config-next@^15.5.7, tailwindcss@^4, @tailwindcss/postcss@^4, @types/node@^22, @types/react@^19, @types/react-dom@^19 (+12 more)

### Community 1 - "ui/package.json"
Cohesion: 0.07
Nodes (34): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.62.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-slot@^1.2.3, tailwind-merge@^3.3.1, devDependencies (+26 more)

### Community 2 - "api/package.json"
Cohesion: 0.06
Nodes (42): drizzleConfig, dependencies, drizzle-orm@^0.45.4, fastify@^5.12.7, @fastify/cookie@^11.1.5, @fastify/cors@^11.3.1, @fastify/helmet@^13.2.0, @fastify/rate-limit@^11.2.1 (+34 more)

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
Cohesion: 0.10
Nodes (34): LoginForm(), onSubmit(), loginPasswordError(), LoginPage(), ResetRequestForm(), onSubmit(), RegisterForm(), onSubmit() (+26 more)

### Community 9 - "db"
Cohesion: 0.17
Nodes (11): environment, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, services (+3 more)

### Community 10 - "session.ts"
Cohesion: 0.16
Nodes (21): ActiveSession, clearSessionCookie(), cookieMaxAgeForNewSession(), cookieMaxAgeSeconds(), createSession(), createSessionToken(), findActiveSession(), hashSessionToken() (+13 more)

### Community 11 - "auth.ts"
Cohesion: 0.08
Nodes (37): alreadyRegisteredLetter(), createEmailToken(), EmailToken, hashEmailToken(), MailLetter, passwordChangedLetter(), resetPasswordLetter(), sendMail() (+29 more)

### Community 12 - "context7"
Cohesion: 0.33
Nodes (5): context7, graphify, npx, /Users/Vladimir/.local/bin/graphify-mcp, @upstash/context7-mcp

### Community 13 - "server.ts"
Cohesion: 0.12
Nodes (29): ApiConfig, isMailMode(), isNodeEnv(), MailMode, mailModeValues, NodeEnv, nodeEnvValues, readApiConfig() (+21 more)

### Community 16 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, jsx, lib, paths, extends, include, ../../config/tsconfig.base.json

### Community 19 - "password-policy.ts"
Cohesion: 0.10
Nodes (24): applyLookalikes(), birthDateForms(), dataDirectory, isListedPassword(), isRepeatedCharacter(), isSimpleSequence(), loadPasswordLists(), readPasswordFile() (+16 more)

### Community 20 - "cleanup.ts"
Cohesion: 0.22
Nodes (13): CleanupLog, runAccountCleanup(), startAccountCleanup(), authEvents, emailTokens, legalAcceptances, loginFailures, mailEvents (+5 more)

### Community 22 - "conor-face.tsx"
Cohesion: 0.11
Nodes (21): clampUnit(), faceGazes, faceStates, HomePage(), onPointerMove(), clamp(), ConorEye(), ConorEyeProps (+13 more)

### Community 23 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 24 - "handoff.sh"
Cohesion: 0.52
Nodes (6): filter_stat(), is_blocked_path(), is_sensitive_key(), report_secret(), handoff.sh script, TZ

### Community 25 - "throttle.ts"
Cohesion: 0.16
Nodes (20): getDatabase(), attemptKey(), AuthEventKind, checkLoginThrottle(), clearEmailAndPairFailures(), clearPairFailures(), DbTransaction, EventWriter (+12 more)

### Community 26 - "offer-draft-1.md"
Cohesion: 0.33
Nodes (5): Возврат, Общие положения, Ограничения сервиса, Порядок оплаты и сроки, Предмет

### Community 27 - "privacy-draft-1.md"
Cohesion: 0.33
Nodes (5): Какие данные собираются, Контакты, Права пользователя, Хранение, Цели

### Community 33 - "auth-stage.tsx"
Cohesion: 0.22
Nodes (11): AuthLayout(), AuthShell(), authLocation(), AuthStage(), onSwitch(), directionFor(), motionClass(), MotionDirection (+3 more)

### Community 34 - "next"
Cohesion: 0.25
Nodes (5): next@^15.5.7, metadata, montserrat, viewport, next

### Community 35 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @devint_ai/ui@workspace:*, react@19.1.0, react-dom@19.1.0, react, react-dom, @devint_ai/ui

### Community 36 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

### Community 37 - "middleware.ts"
Cohesion: 0.53
Nodes (5): config, contentSecurityPolicy(), createNonce(), middleware(), readApiOrigin()

## Knowledge Gaps
- **6 isolated node(s):** `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp`, `../../config/tsconfig.base.json`, `../../config/tsconfig.base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 214 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `web/package.json`, `auth-stage.tsx`, `password-policy.ts`, `middleware.ts`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **What connects `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `RegisterForm()` connect `conor-face.tsx` to `password-policy.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `ui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07394957983193277 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `cleanup.ts` to `api/package.json`, `session.ts`, `auth.ts`, `server.ts`, `throttle.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `api/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06183574879227053 - nodes in this community are weakly interconnected._