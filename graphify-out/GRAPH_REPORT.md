# Graph Report - Devint_AI  (2026-10-29)

## Corpus Check
- 80 files · ~33,934 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 5, .css 3, .mdc 1)

## Summary
- 535 nodes · 907 edges · 33 communities (23 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `038a2cb3`
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
- registerAuthRoutes
- handoff.sh
- throttle.ts
- offer-draft-1.md
- privacy-draft-1.md
- auth-stage.tsx

## God Nodes (most connected - your core abstractions)
1. `registerAuthRoutes()` - 38 edges
2. `getDatabase()` - 18 edges
3. `RegisterForm()` - 18 edges
4. `compilerOptions` - 16 edges
5. `compilerOptions` - 13 edges
6. `readApiConfig()` - 12 edges
7. `startApi()` - 10 edges
8. `Button` - 10 edges
9. `LoginForm()` - 9 edges
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LoginForm()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/button.tsx
- `LoginForm()` --calls--> `Input`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/input.tsx
- `LoginForm()` --calls--> `PasswordInput`  [EXTRACTED]
  apps/web/src/app/(auth)/login/login-form.tsx → packages/ui/src/components/password-input.tsx
- `RegisterForm()` --calls--> `Button`  [EXTRACTED]
  apps/web/src/app/(auth)/register/register-form.tsx → packages/ui/src/components/button.tsx
- `RegisterForm()` --calls--> `Checkbox()`  [EXTRACTED]
  apps/web/src/app/(auth)/register/register-form.tsx → packages/ui/src/components/checkbox.tsx

## Import Cycles
- None detected.

## Communities (33 total, 10 thin omitted)

### Community 0 - "web/package.json"
Cohesion: 0.06
Nodes (39): compat, __dirname, eslintConfig, __filename, dependencies, @devint_ai/ui@workspace:*, react@19.1.0, react-dom@19.1.0 (+31 more)

### Community 1 - "ui/package.json"
Cohesion: 0.08
Nodes (33): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-slot@^1.2.3, tailwind-merge@^3.3.1, devDependencies, @types/react@^19.1.8 (+25 more)

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
Cohesion: 0.06
Nodes (51): LoginForm(), onSubmit(), loginPasswordError(), LoginPage(), RegisterForm(), onSubmit(), RegisterFormProps, birthDateError() (+43 more)

### Community 9 - "db"
Cohesion: 0.17
Nodes (11): environment, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, services (+3 more)

### Community 10 - "session.ts"
Cohesion: 0.16
Nodes (21): ActiveSession, clearSessionCookie(), cookieMaxAgeForNewSession(), cookieMaxAgeSeconds(), createSession(), createSessionToken(), findActiveSession(), hashSessionToken() (+13 more)

### Community 11 - "auth.ts"
Cohesion: 0.09
Nodes (27): alreadyRegisteredLetter(), createEmailToken(), EmailToken, hashEmailToken(), MailLetter, passwordChangedLetter(), resetPasswordLetter(), sendMail() (+19 more)

### Community 12 - "context7"
Cohesion: 0.33
Nodes (5): context7, graphify, npx, /Users/Vladimir/.local/bin/graphify-mcp, @upstash/context7-mcp

### Community 13 - "server.ts"
Cohesion: 0.11
Nodes (30): startAccountCleanup(), ApiConfig, isMailMode(), isNodeEnv(), MailMode, mailModeValues, NodeEnv, nodeEnvValues (+22 more)

### Community 16 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, jsx, lib, paths, extends, include, ../../config/tsconfig.base.json

### Community 19 - "password-policy.ts"
Cohesion: 0.10
Nodes (24): applyLookalikes(), birthDateForms(), dataDirectory, isListedPassword(), isRepeatedCharacter(), isSimpleSequence(), loadPasswordLists(), readPasswordFile() (+16 more)

### Community 20 - "cleanup.ts"
Cohesion: 0.26
Nodes (11): CleanupLog, authEvents, emailTokens, legalAcceptances, loginFailures, mailEvents, passwordCredentials, sessions (+3 more)

### Community 23 - "registerAuthRoutes"
Cohesion: 0.20
Nodes (10): acceptanceRows(), canSendMail(), fullYears(), InvalidTokenError, isAllowedBirthDate(), isRealCalendarDate(), isUniqueViolation(), moscowToday() (+2 more)

### Community 24 - "handoff.sh"
Cohesion: 0.52
Nodes (6): filter_stat(), is_blocked_path(), is_sensitive_key(), report_secret(), handoff.sh script, TZ

### Community 25 - "throttle.ts"
Cohesion: 0.15
Nodes (21): runAccountCleanup(), getDatabase(), attemptKey(), AuthEventKind, checkLoginThrottle(), clearEmailAndPairFailures(), clearPairFailures(), DbTransaction (+13 more)

### Community 26 - "offer-draft-1.md"
Cohesion: 0.33
Nodes (5): Возврат, Общие положения, Ограничения сервиса, Порядок оплаты и сроки, Предмет

### Community 27 - "privacy-draft-1.md"
Cohesion: 0.33
Nodes (5): Какие данные собираются, Контакты, Права пользователя, Хранение, Цели

### Community 33 - "auth-stage.tsx"
Cohesion: 0.10
Nodes (20): next@^15.5.7, AuthLayout(), metadata, montserrat, viewport, AuthShell(), AuthStage(), onSwitch() (+12 more)

## Knowledge Gaps
- **6 isolated node(s):** `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp`, `../../config/tsconfig.base.json`, `../../config/tsconfig.base.json` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 214 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `auth-stage.tsx` to `web/package.json`, `password-policy.ts`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **What connects `npx`, `@upstash/context7-mcp`, `/Users/Vladimir/.local/bin/graphify-mcp` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.059800664451827246 - nodes in this community are weakly interconnected._
- **Why does `RegisterForm()` connect `conor-face.tsx` to `password-policy.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `ui/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0766488413547237 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `cleanup.ts` to `api/package.json`, `session.ts`, `auth.ts`, `server.ts`, `throttle.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `api/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06183574879227053 - nodes in this community are weakly interconnected._