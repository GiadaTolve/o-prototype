import { Elysia } from 'elysia'
import { loadEnv } from '../env'

export const envPlugin = new Elysia({
  name: 'env'
}).decorate('env', loadEnv())
