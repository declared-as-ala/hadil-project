const { z } = require('zod');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file in Backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5000')
    .pipe(z.number().int().positive()),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY is required'),
  XAI_MODEL: z.string().default('grok-4-latest'),
  XAI_BASE_URL: z.string().url().default('https://api.x.ai/v1'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

const env = parsedEnv.data;

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongoUri: env.MONGODB_URI,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  xai: {
    apiKey: env.XAI_API_KEY,
    model: env.XAI_MODEL,
    baseUrl: env.XAI_BASE_URL,
  },
};

