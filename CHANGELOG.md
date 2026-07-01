# Changelog

All notable product releases for the CoCreate monorepo are documented here.

Versioning follows [Semantic Versioning](https://semver.org/) at the **repository** level (one version for the whole product). HTTP API breaking changes are governed separately by URI versioning (`/v1`, `/v2`). See [docs/versioning.md](docs/versioning.md).

## [Unreleased]

### Added

- (nothing yet)

## [0.2.0] - 2026-06-20

### Added

- Portal performance improvements: slimmer API list payloads, tab-gated queries, profile deduplication, deferred Social Listening load, loading skeletons, and activity feed DB indexes.
- Admin avatar crop modal and improved profile photo upload.
- Product semver: root version, changelog, `/health` version metadata, and versioning policy docs.
- Org inbox messaging, instant messaging UX, and URI API versioning (`/v1`).

### Changed

- Client portal middleware gates on Supabase session only (role check deferred to RSC/React Query).
- Admin session uses short-lived cache to reduce duplicate `/api/session` fetches.

[Unreleased]: https://github.com/cocreatecaribbean/cocreate-website-monorepo/compare/v0.2.0...dev
[0.2.0]: https://github.com/cocreatecaribbean/cocreate-website-monorepo/releases/tag/v0.2.0
