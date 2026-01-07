/**
 * Clerk Webhook Handler
 * Syncs user creation/updates from Clerk to Supabase
 *
 * POST /api/webhooks/clerk
 * Handles: user.created, user.updated, user.deleted
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_SECRET_KEY!);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Handle the webhook
  switch (evt.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

      console.log(`[Webhook] Creating user: ${id} (${email})`);

      // Create user in Supabase with free credits
      const { error } = await supabase.from('users').insert({
        clerk_id: id,
        email,
        full_name: fullName,
        credits: 3, // Free tier: 3 credits
      });

      if (error) {
        console.error('Failed to create user in Supabase:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      console.log(`[Webhook] ✅ User created: ${id} with 3 free credits`);
      break;
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

      console.log(`[Webhook] Updating user: ${id}`);

      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          email,
          full_name: fullName,
        })
        .eq('clerk_id', id);

      if (error) {
        console.error('Failed to update user in Supabase:', error);
        // Don't fail the webhook - user might not exist yet
      }

      console.log(`[Webhook] ✅ User updated: ${id}`);
      break;
    }

    case 'user.deleted': {
      const { id } = evt.data;

      console.log(`[Webhook] Deleting user: ${id}`);

      // Delete user from Supabase (cascade will delete related data)
      const { error } = await supabase.from('users').delete().eq('clerk_id', id);

      if (error) {
        console.error('Failed to delete user from Supabase:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }

      console.log(`[Webhook] ✅ User deleted: ${id}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${evt.type}`);
  }

  return NextResponse.json({ received: true });
}
