const BASE_URL = "http://127.0.0.1:8000";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login.html";
        throw new Error("Authentication failed");
    }
    return response;
}

async function apiGet(path) {
    const headers = getAuthHeaders();
    const response = await fetch(`${BASE_URL}${path}`, { headers });
    handleAuthError(response);
    if (!response.ok) throw new Error("API Get Error");
    return await response.json();
}

async function apiPost(path, body) {
    const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
    const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    });
    handleAuthError(response);
    if (!response.ok) throw new Error("API Post Error");
    return await response.json();
}
