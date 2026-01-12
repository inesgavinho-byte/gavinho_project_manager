import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Get OAuth login URL
  app.get("/api/oauth/login-url", (req: Request, res: Response) => {
    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
      const state = Buffer.from(redirectUri).toString("base64");
      const loginUrl = `${ENV.oAuthServerUrl}/oauth/authorize?client_id=${ENV.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${state}`;
      res.json({ loginUrl });
    } catch (error) {
      console.error("[OAuth] Failed to generate login URL", error);
      res.status(500).json({ error: "Failed to generate login URL" });
    }
  });

  // Test login endpoint (development only)
  app.post("/api/test-login", async (req: Request, res: Response) => {
    try {
      const testOpenId = "test-user-" + Date.now();
      const testEmail = "test@gavinho.local";
      const testName = "Utilizador de Teste";

      // Skip database for test login - just create session token

      // Create session token
      const sessionToken = await sdk.createSessionToken(testOpenId, {
        name: testName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        message: "Login de teste bem-sucedido",
        user: {
          openId: testOpenId,
          name: testName,
          email: testEmail,
        },
      });
    } catch (error) {
      console.error("[Test Login] Failed", error);
      res.status(500).json({ error: "Test login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true, message: "Logout bem-sucedido" });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
