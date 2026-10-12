// GET /api/public/app-config. `adminShortcut` is true on development servers and on the hosted demo (STC_DEMO=1),
// where the sign-in page offers "Masuk sebagai admin demo".
export interface AppConfigResponse { demo: boolean; adminShortcut: boolean }
