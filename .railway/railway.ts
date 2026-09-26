import { defineRailway, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "backend";

export default defineRailway(() => {
  const backend = service("backend", {
    build: "npm install --legacy-peer-deps && npm run build",
    start: "npm run migration:run && npm run start:prod",
    // builder from CaC: "NIXPACKS"
  });
  return project("spectacular-respect", {
    resources: [backend],
  });
});
