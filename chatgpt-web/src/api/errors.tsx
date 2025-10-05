export class ApiError extends Error {
    // This property holds field-specific error messages, e.g., { username: "Already exists" }
    details: Record<string, string>;

    constructor(message: string, details: Record<string, string> = {}) {
        // Call the parent Error constructor with the main error message
        super(message);
        // Set the error name for easier identification
        this.name = 'ApiError';
        // Store the detailed, field-specific errors
        this.details = details;
    }
}