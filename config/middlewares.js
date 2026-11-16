// Strapi's default middleware stack, with one change: the Content-Security-Policy
// has to allow the object storage host, otherwise the admin panel renders every
// S3-hosted image as broken once objectStore is enabled.
const s3Host = (() => {
  const endpoint = process.env.AWS_ENDPOINT;
  if (!endpoint) return null;
  try {
    return new URL(endpoint).host;
  } catch {
    // Not a URL (e.g. a bare host) — use it as given.
    return endpoint;
  }
})();

const mediaSources = ["'self'", 'data:', 'blob:', 'market-assets.strapi.io'];
if (s3Host) mediaSources.push(s3Host);

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': mediaSources,
          'media-src': mediaSources,
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
