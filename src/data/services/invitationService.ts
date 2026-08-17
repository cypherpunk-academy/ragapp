import { ragrunRequest } from '@/data/lib/ragrun-client';

export type InvitationStatus = 'none' | 'pending' | 'expired' | 'redeemed';

export async function sendInvitation(inviteeEmail: string): Promise<void> {
  await ragrunRequest('/app/invitations/send', {
    method: 'POST',
    body: { invitee_email: inviteeEmail },
    authenticated: true,
  });
}

export async function redeemInvitation(email: string, code: string): Promise<{ email_otp: string | null }> {
  const result = await ragrunRequest<{ redeemed: boolean; email_otp: string | null }>('/app/invitations/redeem', {
    method: 'POST',
    body: { email, code },
    authenticated: false,
  });
  return { email_otp: result.email_otp ?? null };
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const result = await lookupEmail(email);
  return result.exists;
}

export async function lookupEmail(
  email: string,
): Promise<{ exists: boolean; invitation_status: InvitationStatus }> {
  const result = await ragrunRequest<{ exists: boolean; invitation_status?: InvitationStatus }>(
    '/app/invitations/check-email',
    {
      method: 'POST',
      body: { email },
      authenticated: false,
    },
  );
  return {
    exists: result.exists,
    invitation_status: result.invitation_status ?? 'none',
  };
}
