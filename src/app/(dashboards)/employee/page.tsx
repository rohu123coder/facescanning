// This file is intentionally modified to resolve a persistent Next.js routing conflict.
// By not exporting a default React component, we prevent Next.js from treating this as a page,
// which resolves the "Invalid regular expression" error at startup.
// The correct page for this route is located at /src/app/employee/page.tsx.
export const message = "This file is a placeholder to prevent a build error.";
