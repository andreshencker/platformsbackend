export default () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiKeyInternal: process.env.API_KEY_INTERNAL,
  mongo: { uri: process.env.MONGODB_URI },
  binance: {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  },
});