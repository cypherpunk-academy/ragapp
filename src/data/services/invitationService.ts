import { ragrunRequest } from '@/data/lib/ragrun-client';

export async function sendInvitation(inviteeEmail: string): Promise<void> {
  await ragrunRequest('/app/invitations/send', {
    method: 'POST',
    body: { invitee_email: inviteeEmail },
    authenticated: true,
  });
}

export async function redeemInvitation(email: string, code: string): Promise<void> {
  await ragrunRequest('/app/invitations/redeem', {
    method: 'POST',
    body: { email, code },
    authenticated: false,
  });
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const result = await ragrunRequest<{ exists: boolean }>('/app/invitations/check-email', {
    method: 'POST',
    body: { email },
    authenticated: false,
  });
  return result.exists;
}
