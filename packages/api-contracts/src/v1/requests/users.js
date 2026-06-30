"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteAdminSchema = exports.UpdateAdminRoleSchema = exports.UpdateProfileOptionSchema = exports.CreateProfileOptionSchema = exports.RegisterAvatarSchema = exports.AvatarUploadUrlSchema = exports.UpdateAdminProfileSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
const enums_1 = require("../../zod/enums");
exports.UpdateAdminProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().max(120).optional(),
    jobTitleOptionIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AvatarUploadUrlSchema = zod_1.z.object({
    fileName: zod_1.z.string().max(255),
    mimeType: zod_1.z.string().max(120),
    sizeBytes: zod_1.z.number().int().min(1).max(5 * 1024 * 1024),
});
exports.RegisterAvatarSchema = zod_1.z.object({
    storagePath: zod_1.z.string().max(500),
});
exports.CreateProfileOptionSchema = zod_1.z.object({
    label: zod_1.z.string().max(120),
    sortOrder: zod_1.z.number().int().min(0).optional(),
});
exports.UpdateProfileOptionSchema = zod_1.z.object({
    label: zod_1.z.string().max(120).optional(),
    sortOrder: zod_1.z.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.UpdateAdminRoleSchema = zod_1.z.object({
    role: enums_1.AdminAssignableRoleSchema,
});
exports.InviteAdminSchema = zod_1.z.object({
    email: common_1.emailString,
});
//# sourceMappingURL=users.js.map