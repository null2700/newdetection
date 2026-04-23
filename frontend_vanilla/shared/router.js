document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token && !window.location.pathname.includes("/auth/")) {
        window.location.href = "/auth/login.html";
        return;
    }

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const level = payload.education_level;
            const path = window.location.pathname;

            if (level === "school" && !path.includes("/school/")) {
                window.location.href = "/school/dashboard.html";
            } else if (level === "graduate" && !path.includes("/graduate/")) {
                window.location.href = "/graduate/dashboard.html";
            } else if (level === "civil_services" && !path.includes("/upsc/")) {
                window.location.href = "/upsc/dashboard.html";
            }
        } catch (e) {
            console.error("Token decode error", e);
        }
    }
});
