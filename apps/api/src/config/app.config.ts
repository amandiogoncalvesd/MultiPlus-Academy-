export const appConfig = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: 'api',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedDomains: process.env.ALLOWED_WEBSITE_DOMAINS 
    ? process.env.ALLOWED_WEBSITE_DOMAINS.split(',') 
    : ['*'],
});
