export interface CreateTenantPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantSlug: string;
  plan?: string;
}

export interface CreateTenantResult {
  success: boolean;
  tenantId?: string;
  userId?: string;
  error?: string;
  errorCode?:
    | "EMAIL_ALREADY_EXISTS"
    | "SLUG_ALREADY_EXISTS"
    | "VALIDATION_ERROR"
    | "INTERNAL_ERROR";
}
