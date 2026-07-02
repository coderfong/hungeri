/**
 * Notifier interface. Transactional email lives behind this so the provider
 * (Resend today) can be swapped without touching callers. See resend.ts.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export interface Notifier {
  /** Returns true if actually sent (false when no provider is configured). */
  send(msg: EmailMessage): Promise<boolean>;
}
