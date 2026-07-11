import api from "./api";
import type { User } from "../types";

const sanitizeUser = (raw: any): User => {
  if (!raw) return raw; // Allow null pass-through
  return {
    ...raw,
    balance:
      typeof raw.balance === "string"
        ? parseFloat(raw.balance)
        : raw.balance || 0,
    savings:
      typeof raw.savings === "string"
        ? parseFloat(raw.savings)
        : raw.savings || 0,
    loanBalance:
      typeof raw.loanBalance === "string"
        ? parseFloat(raw.loanBalance)
        : raw.loanBalance || 0,
    roles: Array.isArray(raw.roles) ? raw.roles : ["member"],
    avatarUrl:
      raw.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name || "User")}&background=random`,
    status: raw.status || "pending",
  };
};

export const authService = {
  login: async (identifier: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { identifier, password });

      // CASE 1: PENDING USER (202 Accepted)
      if (response.status === 202) {
        // Return special object telling UI to show OTP form
        return {
          status: "otp_required",
          userId: response.data.data.userId,
        };
      }

      // CASE 2: ACTIVE USER (200 OK)
      if (response.status === 200 && response.data.data.token) {
        const { user, token } = response.data.data;
        const cleanUser = sanitizeUser(user);

        // Save Session
        localStorage.setItem("token", token);
        localStorage.setItem("kmp_adng_user", JSON.stringify(cleanUser));

        return {
          status: "success",
          user: cleanUser,
        };
      }

      throw new Error("Respon server tidak valid.");
    } catch (error: any) {
      // Handle Network/Server Errors
      const msg =
        error.response?.data?.message || error.message || "Gagal Login";
      throw new Error(msg);
    }
  },

  verifyLoginOtp: async (userId: string, otp: string) => {
    try {
      const response = await api.post("/auth/verify-login-otp", {
        userId,
        otp,
      });

      if (response.data.data.token) {
        const { user, token } = response.data.data;
        const cleanUser = sanitizeUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem("kmp_adng_user", JSON.stringify(cleanUser));

        return { status: "success", user: cleanUser };
      }
      throw new Error("Gagal verifikasi OTP");
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "OTP Salah");
    }
  },

  register: async (
    name: string,
    phone: string,
    password: string,
    referralCode?: string,
  ) => {
    const response = await api.post("/auth/register", {
      name,
      phone,
      password,
      referralCode,
    });
    return response.data;
  },

  getProfile: async () => {
    try {
      const response = await api.get(`/users/profile?t=${Date.now()}`);
      return sanitizeUser(response.data.data);
    } catch (error) {
      throw new Error("Sesi habis.");
    }
  },

  logout: () => {
    localStorage.clear();
  },
};
