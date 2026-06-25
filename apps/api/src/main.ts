import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureNestApp } from './configure-app'

const apiEnvPath = join(__dirname, '..', '.env')
if (existsSync(apiEnvPath)) {
  loadEnv({ path: apiEnvPath })
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  configureNestApp(app)

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
}

bootstrap()
