import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function setToken(token: string, rememberMe: boolean = false) {
  if (typeof window === "undefined") return;
  if (rememberMe) {
    localStorage.setItem("token", token);
  } else {
    sessionStorage.setItem("token", token);
  }
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

export function getDecodedToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if expired
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    return decoded;
  } catch (error) {
    removeToken();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getDecodedToken() !== null;
}

export function isAdmin(): boolean {
  const decoded = getDecodedToken();
  return decoded?.role === "admin";
}

export function getEmail(): string | null {
  const decoded = getDecodedToken();
  return decoded ? decoded.sub : null;
}
