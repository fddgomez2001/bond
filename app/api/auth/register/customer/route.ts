import { features } from "@/lib/config/features";
import { handleRegistration } from "@/lib/auth/registration";
import { customerRegistrationSchema } from "@/lib/validations/registration";

export async function POST(request: Request) {
  const governmentId = features.customerGovernmentId;

  return handleRegistration(request, {
    role: "customer",
    schema: customerRegistrationSchema,
    documents:
      governmentId === "off" ? [] : [{ type: "government_id", required: governmentId === "required" }],
  });
}
