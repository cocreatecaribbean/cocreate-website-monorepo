import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { ClientsModule } from './clients/clients.module'
import { ClientPortalModule } from './client-portal/client-portal.module'
import { AdminsModule } from './admins/admins.module'
import { NewsletterModule } from './newsletter/newsletter.module'
import { ProjectsModule } from './projects/projects.module'
import { UsersModule } from './users/users.module'
import { BillingModule } from './billing/billing.module'
import { SocialListeningAdminModule } from './social-listening-admin/social-listening-admin.module'
import { DashboardModule } from './dashboard/dashboard.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: existsSync(join(__dirname, '..', '.env'))
        ? join(__dirname, '..', '.env')
        : undefined,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ClientsModule,
    ClientPortalModule,
    AdminsModule,
    NewsletterModule,
    ProjectsModule,
    UsersModule,
    DashboardModule,
    BillingModule,
    SocialListeningAdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
