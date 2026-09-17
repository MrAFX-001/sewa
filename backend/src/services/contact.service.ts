import { prisma } from "../config/prisma.js";
import { sendContactReceiptEmail } from "../utils/mailer.js";
import type { CreateContactMessageInput } from "../schemas/contact.schema.js";

export async function createContactMessage(input: CreateContactMessageInput, ipAddress: string | null) {
  const created = await prisma.contactMessage.create({
    data: {
      category: input.category,
      fullName: input.fullName,
      teamOrAffiliationId: input.teamOrAffiliationId ?? null,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      ipAddress,
    },
  });

  // Fire-and-forget: the row above is the durable record. See
  // sendContactReceiptEmail's doc comment for why a send failure here
  // shouldn't fail the request.
  sendContactReceiptEmail(created.email, {
    category: created.category,
    fullName: created.fullName,
    subject: created.subject,
  }).catch(() => {
    // Handled & logged in mailer
  });

  return created;
}
