export class ApiError extends Error {
  details: Record<string, string>;
  errorCode?: string;

  constructor(message: string, details: Record<string, string> = {}, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.details = details;
    this.errorCode = errorCode;
  }
}
