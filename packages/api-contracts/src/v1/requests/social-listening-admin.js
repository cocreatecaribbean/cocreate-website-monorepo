"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCreateSetupSchema = exports.ListSubscriptionsQuerySchema = exports.CancelSubscriptionSchema = exports.PatchSubscriptionSchema = exports.GrantSubscriptionSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../zod/enums");
const social_listening_1 = require("./social-listening");
exports.GrantSubscriptionSchema = zod_1.z.object({
    organizationId: zod_1.z.string(),
    plan: enums_1.SocialListeningPlanSchema,
    billingSource: enums_1.SocialListeningBillingSourceSchema,
    periodMonths: zod_1.z.number().int().min(1).optional(),
    autoRenewEnabled: zod_1.z.boolean().optional(),
});
exports.PatchSubscriptionSchema = zod_1.z.object({
    plan: enums_1.SocialListeningPlanSchema.optional(),
    extendMonths: zod_1.z.number().int().min(1).optional(),
    autoRenewEnabled: zod_1.z.boolean().optional(),
});
exports.CancelSubscriptionSchema = zod_1.z.object({
    immediate: zod_1.z.boolean(),
    cancelReason: zod_1.z.string().max(2000).optional(),
});
exports.ListSubscriptionsQuerySchema = zod_1.z.object({
    status: enums_1.SocialListeningSubscriptionStatusSchema.optional(),
    plan: enums_1.SocialListeningPlanSchema.optional(),
    expiringSoon: zod_1.z.coerce.boolean().optional(),
    noSetup: zod_1.z.coerce.boolean().optional(),
});
exports.AdminCreateSetupSchema = social_listening_1.CreateListeningSetupSchema.extend({
    organizationId: zod_1.z.string(),
});
//# sourceMappingURL=social-listening-admin.js.map