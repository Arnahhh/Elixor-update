const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function request(endpoint, options = {}) {
  const { token, body, method = "GET", headers = {} } = options;

  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getDoctors(token) {
  return request("/doctors", {
    method: "GET",
    token,
  });
}

export async function bookAppointment(payload, token) {
  return request("/appointments", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function getAppointments(token) {
  return request("/appointments", {
    method: "GET",
    token,
  });
}

export async function updateAppointmentStatus(id, status, token) {
  return request(`/appointments/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}
