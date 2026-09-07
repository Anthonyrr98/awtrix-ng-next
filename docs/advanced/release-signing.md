# Release signing

Stable update manifests are signed with Ed25519. Release CI verifies the detached
`release-manifest.sig` against `security/release-signing-public.pem` before publishing both files.
Downstream tools can use the same public key for provenance checks. The device-hosted Web UI runs
on local HTTP, where browser signature APIs are not consistently available, so its OTA path keeps
using the manifest's SHA-256 digest to verify the selected firmware image.

The matching private key is stored only as the base64-encoded GitHub Actions secret
`RELEASE_SIGNING_KEY`. It must never be committed, printed in CI logs, or bundled into firmware.

To rotate the key, add the new public key to the firmware first and publish that transition release
with the old key. Only after users can run the transition release should the workflow secret switch
to the new private key. Removing the old public key before that point strands older installations.
