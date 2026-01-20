"use client";

import { useState } from "react";
import { getClientToken, parseJwt, setClientToken, clearClientToken } from "@/lib/auth.client";

export default function DebugAuthPage() {
  const [token, setToken] = useState(() => getClientToken());
  const payload = token ? parseJwt(token) : null;

  const handleSetTestToken = () => {
    // A simple fake token with exp 1 hour from now (not signed) for quick testing
    const fakePayload = { sub: 1, uid: "user_test", exp: Math.floor(Date.now() / 1000) + 3600 };
    const base64 = (obj: Record<string, unknown>): string => btoa(JSON.stringify(obj)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const fake = `header.${base64(fakePayload)}.sig`;
    setClientToken(fake);
    setToken(fake);
  };

  const handleClear = () => {
    clearClientToken();
    setToken(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Auth Debug</h2>
      <div className="mb-2">Token: <code className="break-all">{token || '(none)'}</code></div>
      <div className="mb-4">Payload: <pre>{payload ? JSON.stringify(payload, null, 2) : '(none)'}</pre></div>
      <div className="flex gap-2">
        <button onClick={handleSetTestToken} className="px-4 py-2 bg-gray-100 rounded">Set test token</button>
        <button onClick={handleClear} className="px-4 py-2 bg-red-100 rounded">Clear token</button>
      </div>
    </div>
  );
}
