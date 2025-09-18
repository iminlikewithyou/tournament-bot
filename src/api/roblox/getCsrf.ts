import { config } from "../../config.js";

export async function getCsrf() {
  try {
    const response = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `.ROBLOSECURITY=${config.roblosecurity}`,
      },
    });

    return response.headers.get("X-Csrf-Token")!;
  } catch (error) {
    console.error("Error getting CSRF:", error);
  }
}
