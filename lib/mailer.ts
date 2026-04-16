import nodemailer from 'nodemailer';

function createTransporter() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const email = process.env.GOOGLE_EMAIL;

  if (!refreshToken || !email) {
    console.warn('[Mailer] GOOGLE_REFRESH_TOKEN ou GOOGLE_EMAIL não configurado. Emails não serão enviados.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: email,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  nome: string,
  resetUrl: string
): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Mailer] Simulando envio para ${to}: ${resetUrl}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"MRX Locações" <${process.env.GOOGLE_EMAIL}>`,
      to,
      subject: 'Redefinição de senha — MRX Locações',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 40px 20px;">
          <div style="background: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <span style="color: #fff; font-size: 32px; font-weight: 900; letter-spacing: -1px;">mr</span><span style="color: #1E7BC4; font-size: 32px; font-weight: 900;">X</span>
            <div style="color: #aaa; font-size: 11px; letter-spacing: 3px; margin-top: 2px;">LOCAÇÕES</div>
          </div>
          <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111; margin: 0 0 16px;">Olá, ${nome}!</h2>
            <p style="color: #555; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: #1E7BC4; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
            </div>
            <p style="color: #999; font-size: 13px;">Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Mailer] Erro ao enviar email:', error);
    return false;
  }
}
