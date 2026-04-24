import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

interface EmailRequest {
    to: string;
    subject: string;
    type: 'user_confirmation' | 'admin_notification' | 'superadmin_renewal';
    data: {
        guestName?: string;
        roomName?: string;
        checkIn?: string;
        checkOut?: string;
        estimatedArrival?: string;
        estimatedDeparture?: string;
        bookedAt?: string;
        guests?: number;
        nights?: number;
        totalPrice?: number;
        depositAmount?: number;
        balanceAmount?: number;
        bookingId?: string;
        siteName?: string;
        contactEmail?: string;
        contactPhone?: string;

        // Renewal Fields
        clientName?: string;
        plan?: string;
        amount?: number;
        days?: number;
        requestId?: string;
        superadminUrl?: string;
        adminUrl?: string;
        paymentProof?: string; // Base64
    };
}

// Secure token configuration
const SECRET = process.env.VITE_FIREBASE_APP_ID || 'staycation-secret-salt';

function generateActionToken(id?: string): string {
    return crypto
        .createHash('sha256')
        .update((id || 'default') + SECRET)
        .digest('hex');
}

function generateUserEmailHTML(data: EmailRequest['data']): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: linear-gradient(135deg, #2A9D8F, #264653); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .booking-box { background: #f8f9fa; border-left: 4px solid #2A9D8F; padding: 20px; margin: 20px 0; }
            .booking-box p { margin: 8px 0; }
            .payment-box { background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #264653; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Booking Received!</h1>
                <p style="margin: 10px 0 0;">${data.siteName}</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${data.guestName}</strong>,</p>
                <p>Thank you for your reservation! You have successfully booked <strong>${data.roomName}</strong>.</p>
                
                <div class="booking-box">
                    <h3 style="margin-top: 0; color: #264653;">📋 Reservation Details</h3>
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                    <p><strong>Room:</strong> ${data.roomName}</p>
                    <p><strong>Check-in:</strong> ${data.checkIn} ${data.estimatedArrival ? `at ${data.estimatedArrival}` : ''}</p>
                    <p><strong>Check-out:</strong> ${data.checkOut} ${data.estimatedDeparture ? `at ${data.estimatedDeparture}` : ''}</p>
                    <p><strong>Guests:</strong> ${data.guests}</p>
                    ${data.nights ? `<p><strong>Nights:</strong> ${data.nights}</p>` : ''}
                    ${data.bookedAt ? `<p><strong>Requested On:</strong> ${data.bookedAt}</p>` : ''}
                </div>
                
                <div class="payment-box">
                    <h3 style="margin-top: 0;">💰 Payment Summary</h3>
                    <p><strong>Total Amount:</strong> ₱${data.totalPrice?.toLocaleString() || '0'}</p>
                    ${data.depositAmount ? `<p><strong>Required Deposit:</strong> ₱${data.depositAmount?.toLocaleString()}</p>` : ''}
                    ${data.balanceAmount ? `<p><strong>Balance Due:</strong> ₱${data.balanceAmount?.toLocaleString()}</p>` : ''}
                </div>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p>Need assistance? Reach out to us anytime at <strong>${data.contactEmail || 'our support email'}</strong>${data.contactPhone ? ` or dial <strong>${data.contactPhone}</strong>` : ''}. We are always happy to help!</p>
                
                <p>We look forward to hosting you!</p>
                <p>Warm regards,<br><strong>${data.siteName} Team</strong></p>
            </div>
            
            <div class="footer">
                <p>© ${data.siteName} | Thank you for choosing us!</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateAdminEmailHTML(data: EmailRequest['data'], baseUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .info-box { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .action-box { margin-top: 30px; text-align: center; padding: 20px; background: #fff1f2; border-radius: 12px; border: 1px solid #fecaca; }
            .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px; min-width: 140px; }
            .receipt-preview { margin-top: 20px; border-radius: 8px; border: 1px solid #e5e7eb; max-width: 100%; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 New Booking Alert!</h2>
            </div>
            <div class="content">
                <p>A new booking has been received:</p>

                <div class="info-box">
                    <p><strong>Guest:</strong> ${data.guestName}</p>
                    <p><strong>Room:</strong> ${data.roomName}</p>
                    <p><strong>Check-in:</strong> ${data.checkIn} ${data.estimatedArrival ? `(@ ${data.estimatedArrival})` : ''}</p>
                    <p><strong>Check-out:</strong> ${data.checkOut} ${data.estimatedDeparture ? `(@ ${data.estimatedDeparture})` : ''}</p>
                    <p><strong>Guests:</strong> ${data.guests}</p>
                    ${data.bookedAt ? `<p><strong>Submitted:</strong> ${data.bookedAt}</p>` : ''}
                    <p><strong>Total:</strong> ₱${data.totalPrice?.toLocaleString() || '0'}</p>
                    ${data.depositAmount ? `<p><strong>Deposit:</strong> ₱${data.depositAmount?.toLocaleString()}</p>` : ''}
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                </div>

                ${data.paymentProof ? `
                <div style="margin-top: 20px;">
                    <p><strong>📸 Payment Proof:</strong></p>
                    <img src="cid:payment-proof" class="receipt-preview" alt="Payment Receipt" />
                </div>
                ` : ''}

                <div class="action-box">
                    <h3 style="margin-top: 0; color: #dc2626;">Review Booking</h3>
                    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Review the details and receipt above, then manage the booking in your admin panel:</p>
                    <a href="${data.adminUrl || '#'}" class="btn" style="background-color: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">🔐 Open Admin Dashboard</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateRenewalEmailHTML(data: EmailRequest['data'], baseUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .amount { font-size: 24px; font-weight: bold; color: #047857; margin: 10px 0; }
            .action-box { margin-top: 30px; text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bcf0da; }
            .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px; min-width: 140px; }
            .receipt-preview { margin-top: 20px; border-radius: 8px; border: 1px solid #e5e7eb; max-width: 100%; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>💸 Renewal Proof Submitted!</h2>
            </div>
            <div class="content">
                <p>Hello Superadmin,</p>
                <p>A client has just submitted a renewal payment proof. Please review the details below:</p>

                <div class="info-box">
                    <p><strong>Client / Site Name:</strong> ${data.clientName}</p>
                    <p><strong>Requested Plan:</strong> ${data.plan}</p>
                    <p><strong>Extension Days:</strong> +${data.days} days</p>
                    <div class="amount">₱${data.amount?.toLocaleString()}</div>
                </div>

                ${data.paymentProof ? `
                <div style="margin-top: 20px;">
                    <p><strong>📸 Payment Receipt:</strong></p>
                    <img src="cid:payment-proof" class="receipt-preview" alt="Payment Receipt" />
                </div>
                ` : ''}

                <div class="action-box">
                    <h3 style="margin-top: 0; color: #059669;">Review Renewal</h3>
                    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Verify the receipt above and manage this renewal request securely in the Superadmin panel:</p>
                    <a href="${data.superadminUrl || data.adminUrl || '#'}" class="btn" style="background-color: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">🔐 Open Superadmin Panel</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        return res.status(500).json({ error: 'Email service not configured' });
    }

    try {
        const { to, subject, type, data } = req.body as EmailRequest;

        if (!to || !subject || !type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        let html = '';
        let attachments: any[] = [];

        if (type === 'superadmin_renewal') {
            html = generateRenewalEmailHTML(data, baseUrl);
            if (data.paymentProof && data.paymentProof.startsWith('data:image')) {
                const [meta, base64] = data.paymentProof.split(',');
                const extension = meta.split('/')[1].split(';')[0] || 'png';
                attachments.push({ filename: `receipt.${extension}`, content: Buffer.from(base64, 'base64'), cid: 'payment-proof' });
            }
        } else if (type === 'admin_notification') {
            html = generateAdminEmailHTML(data, baseUrl);
            if (data.paymentProof && data.paymentProof.startsWith('data:image')) {
                const [meta, base64] = data.paymentProof.split(',');
                const extension = meta.split('/')[1].split(';')[0] || 'png';
                attachments.push({ filename: `receipt.${extension}`, content: Buffer.from(base64, 'base64'), cid: 'payment-proof' });
            }
        } else {
            html = generateUserEmailHTML(data);
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
        });

        const info = await transporter.sendMail({
            from: `"${data.siteName || data.clientName || 'System'}" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html,
            attachments
        });

        console.log('Email sent:', info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('Email error:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
