import type { RouteRole } from "./accountType";

export function getHomeByRole(role: RouteRole): string {
  switch (role) {
    case "listener":
      return "/listen";
    case "artist":
      return "/creator";
    case "superadmin":
      return "/admin";
    default:
      return "/onboarding/role";
  }
}
