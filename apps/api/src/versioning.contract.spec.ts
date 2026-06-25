/** @jest-environment node */
import {
  Controller,
  Get,
  INestApplication,
  Module,
  VERSION_NEUTRAL,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { configureNestApp } from './configure-app'

@Controller({ path: 'health', version: VERSION_NEUTRAL })
class TestHealthController {
  @Get()
  check() {
    return { status: 'ok' }
  }
}

@Controller({ path: 'admin/sample', version: '1' })
class TestV1Controller {
  @Get()
  sample() {
    return { ok: true }
  }
}

@Module({
  controllers: [TestHealthController, TestV1Controller],
})
class VersioningTestModule {}

describe('API versioning (contract)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VersioningTestModule],
    }).compile()

    app = moduleRef.createNestApplication()
    configureNestApp(app)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health stays unversioned', async () => {
    await request(app.getHttpServer()).get('/health').expect(200)
  })

  it('GET /v1/admin/sample is mounted under version prefix', async () => {
    const res = await request(app.getHttpServer()).get('/v1/admin/sample').expect(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('legacy unversioned product routes are not mounted', async () => {
    await request(app.getHttpServer()).get('/admin/sample').expect(404)
  })
})
