# Release

`@bctrl/sdk` and the Python `bctrl` package release together under one version.

1. In the platform repo, set the version and regenerate both SDKs:
   `node scripts/generate/fern-clients.mjs --release 3.1.0` (with `BCTRL_SDK_JS_DIR`, `BCTRL_SDK_PY_DIR` and
   `BCTRL_CLI_DIR` pointing at checkouts of this repo, `sdk-py` and `cli`).
2. Merge the resulting changes here and in `sdk-py` after CI passes.
3. Publish a GitHub release tagged `v3.1.0` on the merge commit (`gh release create v3.1.0 --generate-notes`).
   The Publish workflow verifies the tag against `package.json` and publishes to npm through trusted publishing.

npm trusted publishing must name this repository, the `publish.yml` workflow and the `npm` environment.
