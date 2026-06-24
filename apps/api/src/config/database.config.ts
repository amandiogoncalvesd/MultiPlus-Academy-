export const databaseConfig = () => ({
  databaseUrl: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== 'production',
});
