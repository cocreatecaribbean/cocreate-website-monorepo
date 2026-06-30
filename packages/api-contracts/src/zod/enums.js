"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListeningKeywordMatchTypeSchema = exports.ListeningPlatformSchema = exports.SocialListeningSubscriptionStatusSchema = exports.SocialListeningBillingSourceSchema = exports.SocialListeningPlanIdSchema = exports.SocialListeningPlanSchema = exports.AdminAssignableRoleSchema = exports.UserRoleSchema = exports.CancellationOutcomeSchema = exports.ProjectAttachmentVisibilitySchema = exports.ProjectRequestStatusSchema = exports.ClientProjectAccessLevelSchema = exports.ClientOrgRoleSchema = void 0;
const zod_1 = require("zod");
exports.ClientOrgRoleSchema = zod_1.z.enum(['OWNER', 'PROJECT_MANAGER', 'MEMBER']);
exports.ClientProjectAccessLevelSchema = zod_1.z.enum(['MANAGE', 'VIEW']);
exports.ProjectRequestStatusSchema = zod_1.z.enum([
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'REJECTED',
    'CANCELLED',
]);
exports.ProjectAttachmentVisibilitySchema = zod_1.z.enum(['CLIENT', 'INTERNAL']);
exports.CancellationOutcomeSchema = zod_1.z.enum([
    'APPROVED_NO_FEE',
    'APPROVED_WITH_FEE',
    'DENIED',
]);
exports.UserRoleSchema = zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'COLLABORATOR', 'CLIENT']);
exports.AdminAssignableRoleSchema = zod_1.z.enum(['SUPER_ADMIN', 'ADMIN']);
exports.SocialListeningPlanSchema = zod_1.z.enum(['PULSE', 'GROWTH', 'SCALE']);
exports.SocialListeningPlanIdSchema = zod_1.z.enum(['pulse', 'growth', 'scale']);
exports.SocialListeningBillingSourceSchema = zod_1.z.enum([
    'FYGARO',
    'ADMIN_COMP',
    'ADMIN_MANUAL',
]);
exports.SocialListeningSubscriptionStatusSchema = zod_1.z.enum([
    'PENDING_PAYMENT',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
]);
exports.ListeningPlatformSchema = zod_1.z.enum([
    'x',
    'tiktok',
    'reddit',
    'instagram',
    'facebook',
    'web',
    'forums',
]);
exports.ListeningKeywordMatchTypeSchema = zod_1.z.enum(['broad', 'exact']);
//# sourceMappingURL=enums.js.map