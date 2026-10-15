import type { UserRole } from "@/types/database";

export function dashboardPathFor(role: UserRole | null | undefined) {
  switch (role) {
    case "customer":
      return "/dashboard/customer";
    case "vendor":
      return "/dashboard/vendor";
    default:
      // Admin tools and missing profiles are handled on /dashboard itself.
      return "/dashboard";
  }
}
