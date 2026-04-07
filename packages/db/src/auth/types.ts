export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresMfa?: boolean;
  mfaChallengeId?: string;
}

export interface MfaVerifyPayload {
  challengeId: string;
  code: string;
}

export interface MfaVerifyResult {
  success: boolean;
  error?: string;
}

export interface MfaEnrollResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  factorId?: string;
  error?: string;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: string;
  tenant_id: string | null;
  iat: number;
  exp: number;
}
