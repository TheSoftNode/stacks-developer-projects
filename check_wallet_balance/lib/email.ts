import nodemailer from 'nodemailer';

const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Emails will not be sent.');
    return null;
  }
  
  return nodemailer.createTransport(EMAIL_CONFIG);
};

export interface BalanceUpdateEmail {
  to: string;
  userName: string;
  wallets: Array<{
    email: string;
    address: string;
    balance: {
      available: number;
      locked: number;
      total: number;
    };
    previousBalance: {
      available: number;
      locked: number;
      total: number;
    };
    change: {
      available: number;
      locked: number;
      total: number;
    };
  }>;
  updateType: 'scheduled' | 'monthly' | 'manual';
}

export const sendBalanceUpdateEmail = async (emailData: BalanceUpdateEmail): Promise<boolean> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not sent - no transporter configured');
    return false;
  }

  const totalBalance = emailData.wallets.reduce((sum, wallet) => sum + wallet.balance.total, 0);
  const totalChange = emailData.wallets.reduce((sum, wallet) => sum + wallet.change.total, 0);
  const changePercentage = totalBalance > 0 ? ((totalChange / (totalBalance - totalChange)) * 100) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WalletCheck - Balance Update</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #e91e63, #14b8a6); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; }
        .content { padding: 30px 20px; }
        .summary { background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center; }
        .summary h2 { margin: 0 0 16px 0; color: #1e293b; font-size: 24px; }
        .balance { font-size: 36px; font-weight: bold; color: #0f172a; margin: 8px 0; }
        .change { font-size: 18px; font-weight: 600; margin: 8px 0; }
        .change.positive { color: #059669; }
        .change.negative { color: #dc2626; }
        .wallets { margin-bottom: 30px; }
        .wallet-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .wallet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .wallet-email { font-weight: 600; color: #1e293b; }
        .wallet-address { font-family: monospace; font-size: 12px; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
        .wallet-balance { font-size: 20px; font-weight: bold; color: #14b8a6; }
        .wallet-change { font-size: 14px; font-weight: 500; }
        .footer { background-color: #1e293b; padding: 30px 20px; text-align: center; }
        .footer p { color: #94a3b8; margin: 8px 0; font-size: 14px; }
        .footer a { color: #14b8a6; text-decoration: none; }
        .btn { display: inline-block; background-color: #e91e63; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        @media (max-width: 600px) {
          .wallet-header { flex-direction: column; align-items: flex-start; }
          .wallet-balance { margin-top: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 WalletCheck</h1>
          <p>Your ${emailData.updateType === 'monthly' ? 'Monthly' : 'Scheduled'} Balance Update</p>
        </div>
        
        <div class="content">
          <div class="summary">
            <h2>Portfolio Summary</h2>
            <div class="balance">${totalBalance.toFixed(6)} STX</div>
            <div class="change ${totalChange >= 0 ? 'positive' : 'negative'}">
              ${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(6)} STX (${changePercentage.toFixed(2)}%)
            </div>
            <p style="color: #64748b; margin: 16px 0 0 0;">
              Across ${emailData.wallets.length} wallet${emailData.wallets.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div class="wallets">
            <h3 style="color: #1e293b; margin-bottom: 20px;">Wallet Details</h3>
            ${emailData.wallets.map(wallet => `
              <div class="wallet-card">
                <div class="wallet-header">
                  <div>
                    <div class="wallet-email">${wallet.email}</div>
                    <div class="wallet-address">${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="wallet-balance">${wallet.balance.total.toFixed(6)} STX</div>
                    <div class="wallet-change ${wallet.change.total >= 0 ? 'positive' : 'negative'}">
                      ${wallet.change.total >= 0 ? '+' : ''}${wallet.change.total.toFixed(6)} STX
                    </div>
                  </div>
                </div>
                <div style="font-size: 14px; color: #64748b;">
                  Available: ${wallet.balance.available.toFixed(6)} STX | 
                  Locked: ${wallet.balance.locked.toFixed(6)} STX
                </div>
              </div>
            `).join('')}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">View Full Dashboard</a>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 30px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>🔒 Security Notice:</strong> This email contains sensitive financial information. 
              Please verify the sender and never share your wallet details with unauthorized parties.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>WalletCheck</strong> - Professional Crypto Portfolio Manager</p>
          <p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/settings">Update Email Preferences</a> | 
            <a href="${process.env.NEXTAUTH_URL}">Visit Website</a>
          </p>
          <p>This email was sent automatically. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"WalletCheck" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: `💰 WalletCheck: ${emailData.updateType === 'monthly' ? 'Monthly' : 'Scheduled'} Balance Update - ${totalBalance.toFixed(2)} STX`,
      html: htmlContent,
    });

    console.log(`Balance update email sent to ${emailData.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send balance update email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (to: string, userName: string): Promise<boolean> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Welcome email not sent - no transporter configured');
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to WalletCheck</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #e91e63, #14b8a6); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .btn { display: inline-block; background-color: #e91e63; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .feature { margin: 20px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; }
        .footer { background-color: #1e293b; padding: 30px 20px; text-align: center; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to WalletCheck!</h1>
        </div>
        
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Welcome to WalletCheck, your professional crypto portfolio manager! We're excited to help you securely track and manage your Stacks (STX) wallet balances.</p>
          
          <div class="feature">
            <h3>🔒 Bank-Level Security</h3>
            <p>Your wallet data is encrypted with AES-256 encryption. Even our admins cannot access your sensitive information.</p>
          </div>
          
          <div class="feature">
            <h3>📊 Automated Tracking</h3>
            <p>Get balance updates every 5 days and monthly reports on the 12th-16th of each month.</p>
          </div>
          
          <div class="feature">
            <h3>📈 Advanced Analytics</h3>
            <p>Beautiful charts and insights to track your portfolio performance over time.</p>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">Access Your Dashboard</a>
          </div>

          <p>To get started:</p>
          <ol>
            <li>Add your Stacks wallet addresses</li>
            <li>Configure your notification preferences</li>
            <li>Start monitoring your portfolio!</li>
          </ol>

          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br>The WalletCheck Team</p>
        </div>

        <div class="footer">
          <p><strong>WalletCheck</strong> - Professional Crypto Portfolio Manager</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"WalletCheck Team" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: '🎉 Welcome to WalletCheck - Your Crypto Portfolio Manager',
      html: htmlContent,
    });

    console.log(`Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};