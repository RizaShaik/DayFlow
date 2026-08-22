import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return transporter;
}

/**
 * Sends an email via SMTP if configured; otherwise logs it so auth flows
 * (email verification, temp password delivery) are fully testable without
 * real SMTP credentials in local/dev environments.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    logger.info(`[mailer] SMTP not configured — would send to ${to}: "${subject}"`);
    logger.info(`[mailer] ${text || html}`);
    return { delivered: false };
  }

  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
  return { delivered: true };
}
