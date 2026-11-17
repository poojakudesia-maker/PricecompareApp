import { MSG91, SMS_PROVIDER } from './config.ts';

// India requires DLT-registered templates for transactional SMS, which is why
// MSG91 (template-based) is the default production provider.

export interface SmsResult {
  /** Only set by the console provider so the app can show the code in development. */
  devOtp?: string;
}

export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  if (SMS_PROVIDER === 'console') {
    console.log(`[sms:console] OTP for +91 ${phone}: ${otp}`);
    return { devOtp: otp };
  }

  // MSG91 OTP API v5. The template must contain ##OTP## and be DLT-approved.
  // Not exercised in this repo's tests: verify against your MSG91 account before launch.
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', MSG91.templateId);
  url.searchParams.set('mobile', `91${phone}`);
  url.searchParams.set('otp', otp);
  const res = await fetch(url, { method: 'POST', headers: { authkey: MSG91.authKey, 'content-type': 'application/json' } });
  if (!res.ok) throw new Error(`MSG91 responded ${res.status}`);
  const body = (await res.json()) as { type?: string; message?: string };
  if (body.type !== 'success') throw new Error(`MSG91: ${body.message ?? 'send failed'}`);
  return {};
}
