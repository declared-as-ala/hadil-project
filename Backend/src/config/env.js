const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

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
};

