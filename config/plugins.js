// Upload provider. UPLOAD_PROVIDER comes from the chart: "aws-s3" when
// objectStore.enabled is true, "local" otherwise (media then lands on the PVC).
module.exports = ({ env }) => {
  const provider = env('UPLOAD_PROVIDER', 'local');

  if (provider !== 'aws-s3') {
    return {};
  }

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          // Presigned GET URLs. STACKIT Object Storage buckets are private, so
          // without signed URLs the admin panel shows broken thumbnails and the
          // public API hands out media links nobody can open.
          baseUrl: env('AWS_BASE_URL', undefined),
          signedUrlExpires: env.int('AWS_SIGNED_URL_EXPIRES', 3600),
          s3Options: {
            credentials: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
            },
            region: env('AWS_REGION'),
            endpoint: env('AWS_ENDPOINT'),
            // Required for STACKIT: endpoint/bucket/key instead of bucket.endpoint.
            forcePathStyle: env.bool('AWS_S3_FORCE_PATH_STYLE', true),
            params: {
              Bucket: env('AWS_BUCKET'),
              ...(env('AWS_ACL') ? { ACL: env('AWS_ACL') } : {}),
            },
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};
