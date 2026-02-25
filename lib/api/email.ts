import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'missing-key');
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'test@example.com';
const FROM_EMAIL = 'Bitcoin Agent <agent@resend.dev>'; // 使用默认的测试发件人

export async function sendAlertEmail({
    subject,
    html,
}: {
    subject: string;
    html: string;
}) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[email] RESEND_API_KEY not set. Skipping email send.');
            return { success: false, error: 'RESEND_API_KEY not set' };
        }

        if (!process.env.ALERT_EMAIL) {
            console.warn('[email] ALERT_EMAIL not set. Sending to test@example.com');
        }

        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: [ALERT_EMAIL],
            subject: subject,
            html: html,
        });

        return { success: true, data };
    } catch (error) {
        console.error('[email] Failed to send email:', error);
        return { success: false, error };
    }
}

/**
 * 将 Markdown 转换为简单的 HTML（针对邮件排版优化）
 */
export function simpleMarkdownToHtml(markdown: string): string {
    // 替换换行为 br
    let html = markdown.replace(/\n/g, '<br/>');
    // 粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 大标题
    html = html.replace(/### (.*?)<br\/>/g, '<h3 style="margin-top:16px;margin-bottom:8px;color:#333;">$1</h3>');
    html = html.replace(/## (.*?)<br\/>/g, '<h2 style="margin-top:20px;margin-bottom:10px;color:#111;border-bottom:1px solid #eee;padding-bottom:5px;">$1</h2>');
    html = html.replace(/# (.*?)<br\/>/g, '<h1 style="color:#f7931a;">$1</h1>');
    // 引用
    html = html.replace(/> (.*?)<br\/>/g, '<blockquote style="border-left:4px solid #f7931a;padding-left:10px;color:#666;margin-left:0;background:#fff8f0;padding:8px 12px;">$1</blockquote>');

    return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
    ${html}
    <hr style="border:none;border-top:1px solid #eee;margin-top:30px;margin-bottom:20px;" />
    <p style="font-size:12px;color:#999;text-align:center;">此邮件由您的私人 Bitcoin Agent 自动发送。<br/>Amor Fati - 热爱命运。</p>
  </div>`;
}
