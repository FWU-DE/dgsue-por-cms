// SCRATCH: only matters while the chart runs `strapi develop` (runMode:
// develop). `strapi start` serves a static prebuilt bundle via Strapi's own
// server -- no Vite dev server is involved, so this file has no effect there.
// `develop` runs Strapi's admin panel through a Vite dev server, and Vite
// rejects any request whose Host header isn't on its allowlist (a
// DNS-rebinding protection), which is why the deployed hostname needs adding
// here explicitly. Delete this file together with the rest of the
// Content-Type Builder trial on DEV.
const { mergeConfig } = require('vite');

module.exports = (config) => {
  return mergeConfig(config, {
    server: {
      // Leading dot matches any subdomain, so this doesn't need updating if
      // another stage under the same DNS zone runs this trial later.
      allowedHosts: ['.iac.runs.onstackit.cloud'],
    },
  });
};
