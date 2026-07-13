# Visual Feedback Bridge Content Script Loading Fix

## Objective

Fix the extension's core activation path so that a freshly loaded unpacked extension behaves correctly on an HTTP or HTTPS page:

- opening the popup before activation reports annotation mode as inactive;
- clicking Enable mounts the toolbar;
- reopening the popup reports annotation mode as active;
- clicking Disable removes the toolbar;
- Chrome reports no Content Script loading error.

The change is intentionally limited to Content Script packaging and the Popup/Background/Content status contract. Screenshot capture, marker positioning, keyboard shortcuts, storage design, and unrelated lint configuration are outside this change.

## Confirmed Root Causes

1. The current multi-entry Vite build emits static ESM imports in `dist/content/index.js`. Manifest V3 loads a declared Content Script as a classic script, so it fails with `SyntaxError: Cannot use import statement outside a module`.
2. When the Background cannot reach a Content Script, it injects the file and returns `mounted: true` for `PING` without retrying the message. This creates a false active state even if the injected script failed.
3. The normal Content Script returns `mounted` at the top level while the Popup reads `response.data.mounted`, so the status contract is inconsistent even when loading succeeds.

## Considered Approaches

### Separate self-contained Content Script build — selected

Build Popup and Background as ESM-capable extension entries, then build the Content Script separately as a single IIFE with all dynamic imports inlined.

Advantages:

- directly matches Chrome's Content Script execution model;
- produces a deterministic artifact that can be parsed as a classic script;
- does not depend on runtime module loading, web-accessible module paths, or page CSP;
- keeps the runtime activation path simple.

Trade-off: the Content Script bundle is larger because React and `html2canvas` are included in the self-contained file.

### Classic loader with dynamic ESM import — rejected

A small classic Content Script could dynamically import the current ESM bundle. This reduces build restructuring but introduces web-accessible-resource, relative-path, module-preload, and CSP concerns. It is more fragile than a self-contained Content Script.

### CRXJS migration — rejected

CRXJS provides extension-aware Vite packaging and a stronger long-term development workflow. It also adds a dependency and requires a broader build migration, which exceeds the confirmed minimal scope.

## Build Architecture

### Main extension build

`vite.config.ts` will build only:

- `src/popup/index.html`;
- `src/background/index.ts`.

It will continue to empty `dist` for production builds, copy the Manifest and icons, and place the generated Popup HTML at `dist/popup/index.html`. In watch mode it will not empty `dist`, preventing it from deleting the independently generated Content Script.

### Content Script build

A new `vite.content.config.ts` will:

- use `src/content/index.tsx` as its only input;
- write to the existing `dist` directory without emptying it;
- emit `dist/content/index.js` as an IIFE;
- enable `inlineDynamicImports` so `html2canvas` and shared code remain inside the same classic-script artifact;
- preserve the existing React plugin and `@` alias behavior.

### Package scripts

The production build sequence will be:

1. TypeScript type checking;
2. main extension build;
3. Content Script build;
4. generated-artifact verification.

Development watch mode will first create a complete production-shaped `dist`, then run the main and Content Script watchers concurrently with both configured not to remove the other's files. A small development dependency such as `concurrently` is acceptable for this cross-platform orchestration.

## Runtime Message Flow

All `PING` responses use one shape:

```ts
{ success: true, data: { mounted: boolean } }
```

Popup initialization follows this flow:

1. Popup sends `PING` through the Background.
2. Background sends the message to the active tab.
3. If no receiver exists, Background injects `content/index.js` once.
4. Background retries the original `PING` after injection.
5. The newly initialized Content Script responds with `mounted: false` until Enable is clicked.
6. Popup derives its active state only from the retried Content Script response.

No code path may infer `mounted: true` from successful file injection alone.

Enable and Disable continue to use the same relay. Enable mounts the Shadow DOM UI; Disable unmounts it. A later Popup `PING` reports the actual in-page state.

## Error Handling

- Unsupported browser pages continue to return the existing explicit unsupported-page error.
- Failure to inject the Content Script returns the actual injection error to the Popup.
- Failure of the retry after injection returns a connection error and never reports an active state.
- Popup errors remain visible rather than closing the Popup after a failed Enable operation.
- Existing duplicate-mount guards remain in place.

## Verification Strategy

### Build regression check

Add a lightweight Node script under `scripts/` that:

- confirms every Manifest-referenced entry file exists in `dist`;
- parses `dist/content/index.js` using Node's classic-script parser (`vm.Script`);
- fails the build if a static `import` or other classic-script syntax error is reintroduced.

The check must fail against the current broken artifact before the build change and pass after it.

### Automated commands

Run:

```text
npm run typecheck
npm run build
npm run verify:build
```

The existing ESLint plugin installation problem is unrelated and is not part of this fix.

### Chrome acceptance test

1. Build the project and reload the unpacked `dist` extension.
2. Open a fresh `http://localhost:3000` demo tab.
3. Open the Popup and verify it reports annotation mode inactive.
4. Click Enable and verify the floating toolbar appears.
5. Reopen the Popup and verify it reports annotation mode active.
6. Click Disable and verify the toolbar disappears.
7. Reopen the Popup and verify it reports inactive.
8. Check `chrome://extensions` and verify no new extension errors are present.

## Files Expected to Change

- `vite.config.ts`
- `vite.content.config.ts` (new)
- `package.json`
- `package-lock.json`
- `scripts/verify-build.mjs` (new)
- `src/background/index.ts`
- `src/content/index.tsx`

No other functional subsystem is included in this change.
