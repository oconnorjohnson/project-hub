import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Check if webhook secret is configured
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }
  // Get the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await db.insert(users).values({
          id: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || "",
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          imageUrl: evt.data.image_url,
        });
        console.log("User created:", evt.data.id);
        break;

      case "user.updated":
        await db
          .update(users)
          .set({
            email: evt.data.email_addresses[0]?.email_address || "",
            firstName: evt.data.first_name,
            lastName: evt.data.last_name,
            imageUrl: evt.data.image_url,
            updatedAt: new Date(),
          })
          .where(eq(users.id, evt.data.id));
        console.log("User updated:", evt.data.id);
        break;

      case "user.deleted":
        await db.delete(users).where(eq(users.id, evt.data.id));
        console.log("User deleted:", evt.data.id);
        break;

      default:
        console.log("Unhandled event type:", eventType);
    }
  } catch (error) {
    console.error("Database error:", error);
    return new Response("Database error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
