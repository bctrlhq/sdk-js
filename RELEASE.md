# Release

This package is intended to live at `bctrlhq/sdk-js` and publish `@bctrl/sdk`.

## Publish Setup

1. Create the GitHub repository under `bctrlhq`.
2. Configure npm trusted publishing for package `@bctrl/sdk` with this repository and the `npm` environment.
3. Push a tag like `v1.0.9`.

The publish workflow uses GitHub OIDC plus npm provenance. Do not add long-lived npm tokens.

## Contract Sync

Public OpenAPI types are generated from the private platform repo:

```bash
cd ../bctrl
pnpm generate:sdk-contracts
```

Commit the generated `src/generated/openapi-types.ts` change in this repo.
