export default () => ({
  port: Number(process.env.PORT ?? 3000),
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
    poolTimeout: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? '30000', 10),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});
