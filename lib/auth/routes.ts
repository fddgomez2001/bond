import type { UserRole } from "@/types/database";

export function dashboardPathFor(role: UserRole | null | undefined) {
  switch (role) {
    case "customer":
      return "/dashboard/customer";
    case "vendor":
      return "/dashboard/vendor";
    case "admin":
      return "/dashboard/admin";
    default:
      // Missing profiles are handled on /dashboard itself.
      return "/dashboard";
  }
}
