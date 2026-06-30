"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBrand24ProjectSchema = exports.UpdateSocialListeningSchema = exports.LogoUploadUrlSchema = exports.InviteClientSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
exports.InviteClientSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1),
    clientEmail: common_1.emailString,
    enableSocialListening: zod_1.z.boolean().optional(),
    logoUrl: zod_1.z.string().url({ message: 'Invalid URL' }).optional(),
});
exports.LogoUploadUrlSchema = zod_1.z.object({
    fileName: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    sizeBytes: zod_1.z.number().min(1),
});
exports.UpdateSocialListeningSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
});
exports.UpdateBrand24ProjectSchema = zod_1.z.object({
    brand24ProjectId: zod_1.z.string().max(128).nullable().optional(),
});
//# sourceMappingURL=clients.js.map