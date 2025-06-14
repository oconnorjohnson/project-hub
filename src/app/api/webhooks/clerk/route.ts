import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = req.headers;
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: Record<string, unknown>;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const userData = evt.data as Record<string, unknown>;
    const emailAddresses = userData.email_addresses as
      | Array<{ email_address: string }>
      | undefined;
    const primaryEmail = emailAddresses?.[0]?.email_address || "";

    await db
      .insert(users)
      .values({
        id: userData.id as string,
        email: primaryEmail,
        firstName: userData.first_name as string,
        lastName: userData.last_name as string,
        imageUrl: userData.image_url as string,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: primaryEmail,
          firstName: userData.first_name as string,
          lastName: userData.last_name as string,
          imageUrl: userData.image_url as string,
          updatedAt: new Date(),
        },
      });
  }

  return NextResponse.json({ message: "Webhook processed successfully" });
}
