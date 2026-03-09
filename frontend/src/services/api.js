// SmartRetail AI — API Service
// All backend calls go through this module.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  getStores:    (city) => request(`/stores${city ? `?city=${city}` : ""}`),
  getProducts:  (category, limit = 50) =>
    request(`/products?limit=${limit}${category ? `&category=${category}` : ""}`),

  getSalesAnalytics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/sales-analytics${q ? `?${q}` : ""}`);
  },

  predictDemand: (payload) =>
    request("/predict-demand", { method: "POST", body: JSON.stringify(payload) }),

  inventoryRecommendation: (payload) =>
    request("/inventory-recommendation", { method: "POST", body: JSON.stringify(payload) }),

  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ""}`);
  },

  trainModel: () => request("/train", { method: "POST" }),
};
