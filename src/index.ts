import { connectDB } from "./database/database.js";

await connectDB();

import("./bot/index.js");
import("./valkeySubscriptions.js");
