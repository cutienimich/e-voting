const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("iboto-refresh-token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem("iboto-access-token", data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
};

export const apiFetch = async (path, options = {}) => {
  let token = localStorage.getItem("iboto-access-token");

  const makeHeaders = (t) => ({
    ...options.headers,
    Authorization: `Bearer ${t}`,
  });

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers: makeHeaders(token) });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      // Expired na lahat — redirect sa login!
      ["iboto-access-token", "iboto-refresh-token", "iboto-student", "iboto-device-token"]
        .forEach((k) => localStorage.removeItem(k));
      window.location.href = "/login";
      return null;
    }
    // Retry gamit bagong token
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers: makeHeaders(newToken) });
  }

  return res;
};