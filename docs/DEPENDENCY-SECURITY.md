# Dependency maintenance — 2.2.3

Audit snapshot: 13 October 2026. This report covers package dependencies and the separate Nuxt example, not a full application penetration test.

## Result

The root library audit reports zero vulnerabilities, including development dependencies. The Nuxt 4.6.1 example decreased from 15 affected package nodes (13 high, 2 critical) to 11 high and **zero critical**. These counts include transitive effects, not 11 independent vulnerabilities. Two unique upstream advisories remain.

Vue/server-renderer moved to 3.5.44, DOMPurify to 3.4.17 and Vitest to 5.0.4; other compatible lockfile updates are included. MapLibre remains 6.14.0. The npm package name and component APIs are unchanged. Vue Test Utils stays at 2.4.6 to preserve the documented development Node baseline; the newer line brings tooling requiring a newer Node patch.

## NUXT-001 — critical Git tooling advisories: fixed

Location: [Nuxt example package.json](../examples/nuxt4/package.json), scoped `overrides` entry. Nuxt Devtools 3.4.2 originally resolved simple-git 3.36.0. It now resolves simple-git 4.0.2 and argv-parser 2.0.1 with the upstream security guards retained. The installed-tarball Nuxt check exercises the read-only revparse/status APIs used by Devtools and verifies the actual installed version. No unsafe Git options are enabled.

Impact: processing unsafe Git configuration/options in vulnerable tooling could execute commands in the developer process. See [upstream security release](https://github.com/steveukx/git-js/releases/tag/simple-git@4.0.2).

npm overrides apply only at the application root. Installing this map library does **not** override your application's Nuxt dependencies. For the tested Nuxt 4.6.1 / Devtools 3.4.2 example, the application package.json contains:

```json
{"overrides":{"@nuxt/devtools":{"simple-git":"4.0.2"}}}
```

Recheck this override when Nuxt updates its dependency. Devtools remains disabled by default in the example; the patched dependency is still installed and audited.

## NUXT-002 — high braces advisory: upstream unpatched

Location: examples/nuxt4/package-lock.json; Nuxt → Nitro → globby/fast-glob → micromatch → braces 3.0.3. Deeply nested untrusted glob input can exhaust the parser stack. Both the published registry and [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) report no patched release at this snapshot. Build only trusted projects and keep glob configuration trusted. No unsupported replacement or advisory suppression is installed.

## NUXT-003 — high node-forge advisory: upstream unpatched

Location: examples/nuxt4/package-lock.json; Nuxt → Nitro → listhen → node-forge 1.4.0. The advisory concerns RSA signature verification; the presence of this package does not establish exploitability in this map example. Registry 1.4.0 remains affected and [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) lists no patched release. Avoid adding custom certificate/signature verification using this dependency. Do not deploy a development server as a production server.

## Verification and remaining work

The Nuxt installed-package test audits the full consumer tree, rejects any critical finding and rejects advisories other than these two explicit known upstream items. It still reports remaining counts; it does not turn off audit. Type checking, module/plugin builds and SSR checks run separately. A build passing is not a clean Nuxt audit.

Run `npm audit --registry=https://registry.npmjs.org` at the root and in `examples/nuxt4`; dependency advisories and counts can change. A non-forced audit fix was attempted without reducing the two remaining advisories. Forcing npm's suggested Nuxt downgrade would change the tested framework baseline and is not used. Remaining work is adoption of official fixes for these two upstream advisories when available.
