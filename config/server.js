module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Absolute public URL. Strapi builds media URLs and admin redirects from it, so
  // behind the ingress it must be the external https host, not the pod address.
  // The chart sets PUBLIC_URL from ingress.host.
  url: env('PUBLIC_URL', ''),
  // Trust the ingress-nginx X-Forwarded-* headers, otherwise Strapi sees plain
  // http and generates http:// links behind a TLS-terminating proxy.
  proxy: env.bool('IS_PROXIED', true),
  app: {
    // Comma-separated; rotating these invalidates all admin sessions.
    keys: env.array('APP_KEYS'),
  },
});
