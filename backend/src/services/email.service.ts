import nodemailer from 'nodemailer';

// Dikonfigurasi lewat env SMTP_HOST/PORT/SECURE/USER/PASS/FROM (lihat README.md).
// Kalau SMTP_HOST belum diisi (mis. dev lokal sebelum kredensial ditaruh di
// backend/.env), email tidak benar-benar dikirim -- isinya cuma di-log ke
// console supaya alur OTP/reset password tetap bisa ditest tanpa SMTP nyata.
const isConfigured = Boolean(process.env.SMTP_HOST);

const port = Number(process.env.SMTP_PORT) || 587;
// SMTP_SECURE eksplisit menang; kalau kosong, port 465 otomatis dianggap TLS.
const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!transporter) {
    console.warn(`[email] SMTP belum dikonfigurasi -- email TIDAK terkirim. To: ${to} | Subject: ${subject}`);
    console.log(`[email] Isi:\n${html}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

export const sendOtpEmail = async (to: string, otp: string, purposeLabel: string): Promise<void> => {
  await sendEmail(
    to,
    `Kode Verifikasi KMP-ADNG - ${purposeLabel}`,
    `<p>Kode verifikasi Anda untuk <strong>${purposeLabel}</strong>:</p>
     <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
     <p>Kode berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari KMP-ADNG.</p>`,
  );
};

export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<void> => {
  await sendEmail(
    to,
    'Reset Password KMP-ADNG',
    `<p>Ada permintaan reset password untuk akun KMP-ADNG Anda.</p>
     <p><a href="${resetLink}">Klik di sini untuk atur password baru</a></p>
     <p>Link berlaku 30 menit. Kalau Anda tidak meminta ini, abaikan saja email ini -- password Anda tidak akan berubah.</p>`,
  );
};
