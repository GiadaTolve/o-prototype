import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),

  PORT: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !Number.isNaN(v), {
      message: 'PORT must be a number'
    }),

  JWT_SECRET: z.string().min(1),

  DATABASE_URL: z.string().min(1)
})

export type Env = z.infer<typeof EnvSchema>

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables')
    console.error(parsed.error.format())
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}
