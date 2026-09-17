import type { Request, Response } from "express";
import { writeAuditLog } from "../lib/audit.js";
import * as contactService from "../services/contact.service.js";
import type { CreateContactMessageInput } from "../schemas/contact.schema.js";

export async function createContactMessage(req: Request, res: Response) {
  const input = req.body as CreateContactMessageInput;
  const created = await contactService.createContactMessage(input, req.ip ?? null);

  // Unauthenticated endpoint, so userId is omitted \u2014 writeAuditLog already
  // treats it as optional for exactly this case.
  await writeAuditLog({
    req,
    action: "contact_message_submit",
    metadata: { contactMessageId: created.id, category: created.category },
  });

  res.status(201).json({
    message: "Message received. You'll get an email confirmation shortly.",
  });
}
