module.exports = ({ env }) => ({
  auth: {
    // Signs admin panel sessions.
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    // Hashes API tokens. Changing it invalidates every issued token, which breaks
    // the Testcenter integration until a new one is created.
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    // Encrypts values of encrypted fields; rotating makes existing ones unreadable.
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
  },
});
