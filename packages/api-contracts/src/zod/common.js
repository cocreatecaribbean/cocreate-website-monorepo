"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidString = exports.emailString = exports.isoDateString = exports.isoDateTimeString = void 0;
const zod_1 = require("zod");
/** ISO-8601 datetime strings from Nest serializers. */
exports.isoDateTimeString = zod_1.z.string().min(1);
/** Calendar date YYYY-MM-DD (social listening setup). */
exports.isoDateString = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Expected YYYY-MM-DD',
});
exports.emailString = zod_1.z.string().email().max(320);
exports.uuidString = zod_1.z.string().uuid();
