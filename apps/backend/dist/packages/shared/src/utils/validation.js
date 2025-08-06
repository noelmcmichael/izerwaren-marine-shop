"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
exports.safeValidateData = safeValidateData;
exports.createValidationMiddleware = createValidationMiddleware;
const zod_1 = require("zod");
function validateData(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.errors
                .map(err => `${err.path.join('.')}: ${err.message}`)
                .join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw error;
    }
}
function safeValidateData(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
function createValidationMiddleware(schema) {
    return (data) => {
        return validateData(schema, data);
    };
}
