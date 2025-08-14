import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_KEY_INTERNAL: Joi.string().required(),
  MONGODB_URI: Joi.string().uri().required(),
  BINANCE_API_KEY: Joi.string().required(),
  BINANCE_API_SECRET: Joi.string().required(),
});