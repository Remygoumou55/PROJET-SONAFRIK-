import type { RouteRole } from "./getSessionAndRole";

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
