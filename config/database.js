// PostgreSQL only. The chart always provides these variables — either from its
// ConfigMap or, for a managed STACKIT PostgreSQL Flex instance, straight from the
// OpenTofu-provisioned Secret.
module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'postgres'),
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD'),
      schema: env('DATABASE_SCHEMA', 'public'),
      ssl: env.bool('DATABASE_SSL', false) && {
        // STACKIT Flex presents a certificate from a private CA that the Node
        // image does not trust. Verification stays off unless the CA is added to
        // the image and DATABASE_SSL_REJECT_UNAUTHORIZED is set to true — the
        // connection is then encrypted but unauthenticated.
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
      },
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});
