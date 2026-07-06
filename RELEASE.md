# Release

This package is intended to live at `bctrlhq/sdk-js` and publish `@bctrl/sdk`.

## Manual Publish

Publish from a local terminal with the `bctrlhq` npm account:

```bash
npm whoami
npm publish --access public --provenance=false
```

Use `--provenance=false` for local publishes. Provenance is only available from supported CI providers. Complete npm's 2FA prompt when it appears.

After npm publish succeeds, tag the exact commit and create a GitHub release:

```bash
git tag -a v1.0.10 -m "@bctrl/sdk v1.0.10"
git push origin v1.0.10
gh release create v1.0.10 --title "@bctrl/sdk v1.0.10" --notes "Published @bctrl/sdk v1.0.10."
```

The GitHub Actions release workflow is a verification gate only. It does not publish to npm.

## Contract Sync

Public OpenAPI types are generated from the private platform repo:

```bash
cd ../bctrl
pnpm generate:sdk-contracts
```

Commit the generated `src/generated/openapi-types.ts` change in this repo.
