import { fetchV1 } from "./fetchV1.js";
import { UsersV1Response } from "./types.js";

export async function getUser(id: number) {
  try {
    const user = await fetchV1<UsersV1Response>(
      `https://users.roblox.com/v1/users/${id}`
    );

    return user;
  } catch {
    return undefined;
  }
}
