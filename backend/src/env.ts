import dotenv from "dotenv";

// Imported first (before any module that reads process.env at module-load
// time, e.g. currentUser.ts's firebase-admin init) so env vars are populated
// before those top-level reads run.
dotenv.config();
