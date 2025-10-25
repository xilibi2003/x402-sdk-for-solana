import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateJwt } from "@coinbase/cdp-sdk/auth";
import { POST } from "./session-token";

// Mock the CDP SDK
vi.mock("@coinbase/cdp-sdk/auth", () => ({
  generateJwt: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("session-token POST handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockEnv: Record<string, string | undefined>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock environment variables
    mockEnv = {
      CDP_API_KEY_ID: "test-key-id",
      CDP_API_KEY_SECRET: "test-key-secret",
    };
    vi.stubGlobal("process", {
      env: mockEnv,
    });

    // Set up Express request and response mocks
    mockReq = {
      body: {},
    } as Request;

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("successful token generation", () => {
    it("should generate session token successfully", async () => {
      const mockJwt = "mock-jwt-token";
      const mockSessionToken = {
        token: "session-token-123",
        expires_at: "2024-01-01T00:00:00Z",
      };

      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue(mockJwt);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSessionToken),
      } as unknown as globalThis.Response);

      await POST(mockReq as Request, mockRes as Response);

      expect(generateJwt).toHaveBeenCalledWith({
        apiKeyId: "test-key-id",
        apiKeySecret: "test-key-secret",
        requestMethod: "POST",
        requestHost: "api.developer.coinbase.com",
        requestPath: "/onramp/v1/token",
      });

      expect(fetch).toHaveBeenCalledWith("https://api.developer.coinbase.com/onramp/v1/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mockJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addresses: [
            {
              address: "0x1234567890123456789012345678901234567890",
              blockchains: ["base"],
            },
          ],
        }),
      });

      expect(mockRes.json).toHaveBeenCalledWith(mockSessionToken);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("environment variable validation", () => {
    it("should return 500 when CDP_API_KEY_ID is missing", async () => {
      mockEnv.CDP_API_KEY_ID = undefined;

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Server configuration error: Missing CDP API credentials",
      });
    });

    it("should return 500 when CDP_API_KEY_SECRET is missing", async () => {
      mockEnv.CDP_API_KEY_SECRET = undefined;

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Server configuration error: Missing CDP API credentials",
      });
    });

    it("should return 500 when both API keys are missing", async () => {
      mockEnv.CDP_API_KEY_ID = undefined;
      mockEnv.CDP_API_KEY_SECRET = undefined;

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Server configuration error: Missing CDP API credentials",
      });
    });
  });

  describe("request body validation", () => {
    it("should return 400 when addresses is missing", async () => {
      mockReq.body = {};

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "addresses is required and must be a non-empty array",
      });
    });

    it("should return 400 when addresses is null", async () => {
      mockReq.body = { addresses: null };

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "addresses is required and must be a non-empty array",
      });
    });

    it("should return 400 when addresses is not an array", async () => {
      mockReq.body = { addresses: "not-an-array" };

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "addresses is required and must be a non-empty array",
      });
    });

    it("should return 400 when addresses is empty array", async () => {
      mockReq.body = { addresses: [] };

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "addresses is required and must be a non-empty array",
      });
    });
  });

  describe("JWT generation errors", () => {
    it("should return 500 when JWT generation fails", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockRejectedValue(new Error("JWT generation failed"));

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("CDP API errors", () => {
    it("should return 400 when CDP API returns 400", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue("mock-jwt");
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      } as unknown as globalThis.Response);

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate session token",
      });
    });

    it("should return 401 when CDP API returns 401", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue("mock-jwt");
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      } as unknown as globalThis.Response);

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate session token",
      });
    });

    it("should return 500 when CDP API returns 500", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue("mock-jwt");
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      } as unknown as globalThis.Response);

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate session token",
      });
    });
  });

  describe("network errors", () => {
    it("should return 500 when fetch fails", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue("mock-jwt");
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should return 500 when response.json() fails", async () => {
      mockReq.body = {
        addresses: [{ address: "0x1234567890123456789012345678901234567890" }],
      };

      vi.mocked(generateJwt).mockResolvedValue("mock-jwt");
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("JSON parsing error")),
      } as unknown as globalThis.Response);

      await POST(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });
});
