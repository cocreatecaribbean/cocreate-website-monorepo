"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelSubscriptionClientSchema = exports.ToggleAutoRenewSchema = exports.SubscribeBillingSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../zod/enums");
exports.SubscribeBillingSchema = zod_1.z.object({
    plan: enums_1.SocialListeningPlanIdSchema,
});
exports.ToggleAutoRenewSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
});
exports.CancelSubscriptionClientSchema = zod_1.z.object({
    cancelReason: zod_1.z.string().max(2000).optional(),
});
//# sourceMappingURL=billing.js.map