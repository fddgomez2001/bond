import { handleRegistration } from "@/lib/auth/registration";
import { vendorRegistrationSchema } from "@/lib/validations/registration";

export async function POST(request: Request) {
  return handleRegistration(request, {
    role: "vendor",
    schema: vendorRegistrationSchema,
    documents: [
      { type: "selfie", required: true },
      { type: "government_id", required: true },
      { type: "proof_of_business", required: true },
    ],
  });
}
