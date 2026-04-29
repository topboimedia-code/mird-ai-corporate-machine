"use client";

import { useEffect, useState, useTransition } from "react";
import { createBrowserClient } from "@rainmachine/db";
import { useRouter } from "next/navigation";

type EnrollState =
  | { status: "loading" }
  | { status: "ready"; qrCode: string; secret: string; factorId: string }
  | { status: "verifying"; factorId: string }
  | { status: "success" }
  | { status: "error"; message: string };

export default function EnrollMfaPage() {
  const router = useRouter();
  const [state, setState] = useState<EnrollState>({ status: "loading" });
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient();

  useEffect(() => {
    async function startEnrollment() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "RainMachine CEO",
      });

      if (error || !data) {
        setState({ status: "error", message: error?.message ?? "Enrollment failed." });
        return;
      }

      setState({
        status: "ready",
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      });
    }

    void startEnrollment();
  }, []); // supabase client is stable — safe to omit

  function handleVerify() {
    if (state.status !== "ready") return;
    const { factorId } = state;

    startTransition(async () => {
      setState({ status: "verifying", factorId });

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError || !challengeData) {
        setState({
          status: "error",
          message: challengeError?.message ?? "Challenge failed.",
        });
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });

      if (verifyError) {
        setState({
          status: "error",
          message: verifyError.message ?? "Invalid code. Try again.",
        });
        return;
      }

      setState({ status: "success" });
      setTimeout(() => router.push("/"), 1500);
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050D1A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        color: "#E8F4FD",
      }}
    >
      <div
        style={{
          background: "#0A1628",
          border: "1px solid #1E3A5F",
          borderRadius: 12,
          padding: 40,
          width: 400,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Orbitron, sans-serif",
            color: "#00D4FF",
            fontSize: 20,
            letterSpacing: 4,
            marginBottom: 8,
          }}
        >
          ENABLE 2FA
        </h1>
        <p style={{ color: "#6B7A99", fontSize: 14, marginBottom: 32 }}>
          Scan the QR code with Google Authenticator or Authy, then enter the
          6-digit code.
        </p>

        {state.status === "loading" && (
          <p style={{ color: "#6B7A99" }}>Generating QR code…</p>
        )}

        {state.status === "error" && (
          <p style={{ color: "#FF4444" }}>{state.message}</p>
        )}

        {state.status === "success" && (
          <p style={{ color: "#00FF88", fontSize: 16 }}>
            ✓ 2FA enabled. Redirecting…
          </p>
        )}

        {(state.status === "ready" || state.status === "verifying") && (
          <>
            {state.status === "ready" && (
              <>
                {/* img is fine here — QR data URI, not a static asset */}
                <img
                  src={state.qrCode}
                  alt="TOTP QR code"
                  style={{
                    width: 200,
                    height: 200,
                    margin: "0 auto 16px",
                    display: "block",
                    borderRadius: 8,
                    background: "#fff",
                    padding: 8,
                  }}
                />
                <p
                  style={{
                    color: "#6B7A99",
                    fontSize: 11,
                    marginBottom: 24,
                    wordBreak: "break-all",
                  }}
                >
                  Manual key: {state.secret}
                </p>
              </>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#050D1A",
                border: "1px solid #1E3A5F",
                borderRadius: 8,
                color: "#E8F4FD",
                fontSize: 24,
                letterSpacing: 8,
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) handleVerify();
              }}
              autoFocus
            />

            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || isPending}
              style={{
                width: "100%",
                padding: "12px 0",
                background: code.length === 6 && !isPending ? "#00D4FF" : "#1E3A5F",
                color: code.length === 6 && !isPending ? "#050D1A" : "#6B7A99",
                border: "none",
                borderRadius: 8,
                fontFamily: "Orbitron, sans-serif",
                fontSize: 13,
                letterSpacing: 2,
                cursor: code.length === 6 && !isPending ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              {isPending ? "VERIFYING…" : "ACTIVATE"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
