interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class EmailService {
  private sender: string;
  private apiKey: string | undefined;

  constructor() {
    this.sender = process.env.EMAIL_FROM || process.env.MOCK_EMAIL_SENDER || 'noreply@kreativ.com';
    this.apiKey = process.env.RESEND_API_KEY;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.apiKey) {
      // Fallback to mock if no API key
      console.log('--- MOCK EMAIL (no RESEND_API_KEY set) ---');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Body:', options.text);
      console.log('------------------------------------------');
      await new Promise(resolve => setTimeout(resolve, 50));
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.sender,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Email send failed:', error);
      } else {
        console.log('✅ Email sent to:', options.to);
      }
    } catch (error) {
      console.error('❌ Email service error:', error);
    }
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const subject = 'Your One-Time Password (OTP) - KreativS';
    const text = `Your OTP is ${otp}. It is valid for 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <img src="https://pub-ed2c4f7cc14b486bb2c92bb40d041224.r2.dev/kreativs-ai-logo.jpg" alt="KreativS" style="width: 80px; margin-bottom: 20px;" />
        <h2 style="color: #333;">Your Verification Code</h2>
        <p style="color: #666;">Use the OTP below to verify your account:</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #999; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">KreativS AI App — <a href="mailto:support@kreativ.com">support@kreativ.com</a></p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }
}

export const emailService = new EmailService();
