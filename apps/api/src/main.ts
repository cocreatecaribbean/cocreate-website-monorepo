import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

const apiEnvPath = join(__dirname, '..', '.env')
if (existsSync(apiEnvPath)) {
  loadEnv({ path: apiEnvPath })
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
}

bootstrap()
