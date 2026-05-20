const BASE_URL = "http://localhost:5000";

// ── STUDENT API ─────────────────────────────────────────────
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("iboto-refresh-token");
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json();
  if (data.success) {
    localStorage.setItem("iboto-access-token", data.data.accessToken);
    return data.data.accessToken;
  }
  return null;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("iboto-access-token");

  const isFormData = options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      localStorage.clear();
      window.location.href = "/login";
      return null;
    }
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  }

  return res;
}

// ── ADMIN API ───────────────────────────────────────────────
export async function adminApiFetch(path, options = {}) {
  const token = localStorage.getItem("iboto-admin-token");

  if (!token) {
    window.location.href = "/admin/login";
    return null;
  }

  const isFormData = options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin");
    window.location.href = "/admin/login";
    return null;
  }

  return res;
}