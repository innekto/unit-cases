import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.getGoogleEmail(),
        pass: this.getGooglePassword(),
      },
    });
  }

  private getGoogleEmail() {
    return this.configService.get<string>('GOOGLE_EMAIL') ?? '';
  }

  private getGooglePassword() {
    return this.configService.get<string>('GOOGLE_PASSWORD') ?? '';
  }

  private getUnverifiedUserTtlMinutes() {
    return Number(this.configService.get<string>('UNVERIFIED_USER_TTL_MINUTES') ?? '10');
  }

  private async sendMail(email: string, subject: string, html: string) {
    const mailOptions = {
      from: this.getGoogleEmail(),
      to: email,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${email}: ${info.response}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendEmailVerification(
    email: string,
    rawCode: string,
    sessionId: string,
    ip: string,
    userAgent: string,
  ) {
    const subject = 'SYSTEM ACCESS VERIFICATION';
    const ttlMinutes = this.getUnverifiedUserTtlMinutes();

    const html = `
<div style="background:#05060a;color:#d1d5db;padding:28px;font-family:monospace;border:1px solid #1f2937">

  <div style="color:#38bdf8;font-size:13px;">
    // NEXUS AUTHORITY :: AUTHORIZATION NODE
  </div>

  <div style="margin-top:12px;font-size:11px;color:#6b7280;">
    SESSION: ${sessionId}<br/>
    IP: ${ip}<br/>
    AGENT: ${userAgent}<br/>
    TIME: ${new Date().toISOString()}
  </div>

  <hr style="border-color:#1f2937;margin:14px 0;" />

  <p style="margin-bottom:10px;">
    Authentication request detected.
  </p>

  <p style="color:#9ca3af;">
    One-time verification code generated:
  </p>

  <div style="
    text-align:center;
    font-size:36px;
    letter-spacing:8px;
    color:#fb7185;
    padding:16px;
    border:1px solid #fb7185;
    background:rgba(251,113,133,0.05);
    margin:20px 0;
  ">
    ${rawCode}
  </div>

  <div style="font-size:11px;color:#4b5563;">
    Attempts allowed: 5<br/>
    Code expires in: ${ttlMinutes} minutes<br/>
    Unconfirmed accounts are retired in ${ttlMinutes} minutes to keep the // NEXUS CORPORATION // grid clear of ghost identities, rogue profiles, and synthetic noise.<br/>
    If this was not you - ignore this transmission.
  </div>

  <div style="margin-top:18px;font-size:10px;color:#2f2f3a;">
    // END OF TRANSMISSION
  </div>

</div>
`;

    await this.sendMail(email, subject, html);
  }

  async sendPasswordReset(
    email: string,
    resetCode: string,
    expiresAt: Date,
    sessionId: string,
    ip: string,
    userAgent: string,
  ) {
    const subject = 'SYSTEM PASSWORD RESET';
    const actionHtml = `
  <p style="color:#9ca3af;">
    One-time reset code generated:
  </p>

  <div style="
    text-align:center;
    font-size:36px;
    letter-spacing:8px;
    color:#fbbf24;
    padding:16px;
    border:1px solid #fbbf24;
    background:rgba(251,191,36,0.08);
    margin:20px 0;
  ">
    ${resetCode}
  </div>
`;

    const html = `
<div style="background:#05060a;color:#d1d5db;padding:28px;font-family:monospace;border:1px solid #1f2937">

  <div style="color:#fbbf24;font-size:13px;">
    // NEXUS AUTHORITY :: RECOVERY NODE
  </div>

  <div style="margin-top:12px;font-size:11px;color:#6b7280;">
    SESSION: ${sessionId}<br/>
    IP: ${ip}<br/>
    AGENT: ${userAgent}<br/>
    TIME: ${new Date().toISOString()}
  </div>

  <hr style="border-color:#1f2937;margin:14px 0;" />

  <p style="margin-bottom:10px;">
    Password reset request detected.
  </p>

  ${actionHtml}

  <div style="font-size:11px;color:#4b5563;">
    Attempts allowed: 5<br/>
    Code expires in: 10 minutes<br/>
    Expires at: ${expiresAt.toISOString()}<br/>
    If this was not you - ignore this transmission.
  </div>

  <div style="margin-top:18px;font-size:10px;color:#2f2f3a;">
    // END OF TRANSMISSION
  </div>

</div>
`;

    await this.sendMail(email, subject, html);
  }

  async sendSetPasswordLetter(email: string) {
    const subject = 'PASSWORD UPDATED';
    const html = `
<div style="background:#05060a;color:#d1d5db;padding:28px;font-family:monospace;border:1px solid #1f2937">

  <div style="color:#22c55e;font-size:13px;">
    // NEXUS AUTHORITY :: PASSWORD NODE
  </div>

  <div style="margin-top:12px;font-size:11px;color:#6b7280;">
    TIME: ${new Date().toISOString()}
  </div>

  <hr style="border-color:#1f2937;margin:14px 0;" />

  <p style="margin-bottom:10px;">
    Password has been changed successfully.
  </p>

  <div style="font-size:11px;color:#4b5563;">
    If you did not perform this action, reset password immediately.
  </div>

  <div style="margin-top:18px;font-size:10px;color:#2f2f3a;">
    // END OF TRANSMISSION
  </div>

</div>
`;

    await this.sendMail(email, subject, html);
  }
}
