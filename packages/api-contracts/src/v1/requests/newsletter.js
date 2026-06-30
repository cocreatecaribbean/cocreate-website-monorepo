"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribeNewsletterSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
exports.SubscribeNewsletterSchema = zod_1.z.object({
    email: common_1.emailString,
    website: zod_1.z.string().optional(),
});
//# sourceMappingURL=newsletter.js.map