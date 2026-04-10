import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'visionarywebco@gmail.com',
        pass: 'xyoprqhzmjuskgsu'
    }
});

interface EmailRequest {
    to: string;
    subject: string;
    type: 'user_confirmation' | 'admin_notification' | 'superadmin_renewal';
    data: {
        guestName: string;
        roomName: string;
        checkIn: string;
        checkOut: string;
        guests: number;
        nights?: number;
        totalPrice: number;
        depositAmount?: number;
        balanceAmount?: number;
        bookingId: string;
        siteName: string;
        contactEmail?: string;
        contactPhone?: string;
        paymentDeadline?: string;

        // Renewal Fields
        clientName?: string;
        plan?: string;
        amount?: number;
        days?: number;
    };
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
            .highlight { color: #2A9D8F; font-weight: bold; }
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
                    <p><strong>Check-in:</strong> ${data.checkIn}</p>
                    <p><strong>Check-out:</strong> ${data.checkOut}</p>
                    <p><strong>Guests:</strong> ${data.guests}</p>
                    ${data.nights ? `<p><strong>Nights:</strong> ${data.nights}</p>` : ''}
                </div>
                
                <div class="payment-box">
                    <h3 style="margin-top: 0;">💰 Payment Summary</h3>
                    <p><strong>Total Amount:</strong> ₱${data.totalPrice.toLocaleString()}</p>
                    ${data.depositAmount ? `<p><strong>Required Deposit:</strong> ₱${data.depositAmount.toLocaleString()}</p>` : ''}
                    ${data.balanceAmount ? `<p><strong>Balance Due:</strong> ₱${data.balanceAmount.toLocaleString()}</p>` : ''}
                </div>
                
                ${data.paymentDeadline ? `<p style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">⚠️ <strong>Action Required:</strong> To secure your reservation, please settle the required deposit. Any remaining balance will simply be collected upon your arrival at the property.</p>` : ''}
                
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

function generateAdminEmailHTML(data: EmailRequest['data']): string {
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
                    <p><strong>Check-in:</strong> ${data.checkIn}</p>
                    <p><strong>Check-out:</strong> ${data.checkOut}</p>
                    <p><strong>Guests:</strong> ${data.guests}</p>
                    <p><strong>Total:</strong> ₱${data.totalPrice.toLocaleString()}</p>
                    ${data.depositAmount ? `<p><strong>Deposit:</strong> ₱${data.depositAmount.toLocaleString()}</p>` : ''}
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                </div>
                
                <p>Please review and confirm this booking in the admin panel.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateRenewalEmailHTML(data: any): string {
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>💸 Payment Proof Submitted!</h2>
            </div>
            <div class="content">
                <p>Hello Superadmin,</p>
                <p>A client has just submitted a renewal payment proof. Please check your Superadmin Dashboard to review the request.</p>
                
                <div class="info-box">
                    <p><strong>Client / Site Name:</strong> ${data.clientName}</p>
                    <p><strong>Requested Plan:</strong> ${data.plan}</p>
                    <p><strong>Extension Days:</strong> +${data.days} days</p>
                    <div class="amount">₱${data.amount?.toLocaleString()}</div>
                </div>
                
                <p>Log in to your <strong>/superadmin</strong> panel to Approve or Reject this transaction.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${data.superadminUrl || '#'}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Superadmin Panel</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Hardcoded credentials are used, skipping env check

    try {
        const { to, subject, type, data } = req.body as EmailRequest;

        // Validate required fields
        if (!to || !subject || !type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate HTML based on email type
        let html = '';
        if (type === 'superadmin_renewal') {
            html = generateRenewalEmailHTML(data);
        } else if (type === 'admin_notification') {
            html = generateAdminEmailHTML(data);
        } else {
            html = generateUserEmailHTML(data);
        }

        // Send email
        const info = await transporter.sendMail({
            from: `"${data.siteName || data.clientName || 'System'}" <visionarywebco@gmail.com>`,
            to: to,
            subject: subject,
            html: html
        });

        console.log('Email sent:', info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });

    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
