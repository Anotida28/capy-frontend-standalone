"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { encodeBasicAuth } from "@/lib/auth/basic-auth";
import { ENV } from "@/lib/config/env";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { getDefaultRouteForRole, isRouteAllowed } from "@/lib/auth/access-control";
import { resolveRoleFromCredentials, resolveRoleFromUsername } from "@/lib/auth/credential-role";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setCredentials } = useAuth();
  const { notify } = useToast();
  const [formState, setFormState] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const username = formState.username.trim();
      const password = formState.password;
      const resolvedRole = resolveRoleFromUsername(username);
      if (!resolvedRole) {
        throw new Error("Login failed. Unknown username.");
      }
      if (ENV.useMockApi) {
        const mockRole = resolveRoleFromCredentials(username, password);
        if (!mockRole) {
          throw new Error("Login failed. Invalid credentials.");
        }
      } else {
        const base = ENV.apiBaseUrl.trim();
        if (!base) {
          throw new Error("Login failed. API base URL is not configured.");
        }

        const response = await fetch(`${base}/api/v1/projects`, {
          headers: {
            Authorization: `Basic ${encodeBasicAuth(username, password)}`
          },
          cache: "no-store"
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Login failed. Invalid username or password.");
          }
          if (response.status === 403) {
            throw new Error("Login failed. Access denied by backend.");
          }
          if (response.status === 404) {
            throw new Error("Login failed. Backend endpoint not found.");
          }
          throw new Error(`Login failed. Backend returned ${response.status}.`);
        }
      }
      setCredentials(username, password, resolvedRole);
      notify({ message: "Signed in successfully", tone: "success" });
      const next = params.get("next");
      const fallback = getDefaultRouteForRole(resolvedRole);
      const destination = next && isRouteAllowed(resolvedRole, next) ? next : fallback;
      router.replace(destination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Image
            className="login-logo"
            src="/logo.png"
            alt="The GAP Company logo"
            width={140}
            height={45}
            priority
          />
          <h1>Sign in</h1>
          <p className="muted">Access The GAP Operations & Finance workspace.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">Username</span>
            <input name="username" value={formState.username} onChange={handleChange} required />
          </label>
          <label className="form-field">
            <span className="form-label">Password</span>
            <input name="password" type="password" value={formState.password} onChange={handleChange} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
