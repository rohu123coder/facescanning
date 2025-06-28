// This file's content has been replaced to resolve a persistent server startup error.
// The route group '(dashboards)' combined with the '/employee' path was causing a fatal bug in the Next.js development server.
// By removing the default component export, Next.js will no longer treat this as a page, thus resolving the crash.
export const metadata = {
  title: "Deactivated Page",
};
