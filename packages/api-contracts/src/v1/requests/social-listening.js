"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateListeningSetupSchema = exports.ListeningSetupKeywordSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("../../zod/common");
const enums_1 = require("../../zod/enums");
exports.ListeningSetupKeywordSchema = zod_1.z.object({
    value: zod_1.z.string().min(3).max(50),
    matchType: enums_1.ListeningKeywordMatchTypeSchema,
});
exports.CreateListeningSetupSchema = zod_1.z.object({
    keywords: zod_1.z.array(exports.ListeningSetupKeywordSchema).min(1).max(5),
    platforms: zod_1.z.array(enums_1.ListeningPlatformSchema).min(1).max(7),
    startDate: common_1.isoDateString,
    endDate: common_1.isoDateString,
});
//# sourceMappingURL=social-listening.js.map