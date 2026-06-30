import {
  INestApplication,
  VersioningType,
} from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function configureNestApp(app: INestApplication): void {
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
  })

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CoCreate API')
    .setDescription('Versioned REST API for CoCreate apps')
    .setVersion('1')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)
}
