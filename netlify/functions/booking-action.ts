import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Firebase configuration from environment
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const SECRET = process.env.VITE_FIREBASE_APP_ID || 'staycation-secret-salt';

// Email transporter for guest notification
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'visionarywebco@gmail.com',
        pass: 'xyoprqhzmjuskgsu'
    }
});

function validateToken(id: string, token: string): boolean {
    const expected = crypto
        .createHash('sha256')
        .update(id + SECRET)
        .digest('hex');
    return token === expected;
}

// User email template (identical to send-email utility)
function generateUserEmailHTML(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: linear-gradient(135deg, #2A9D8F, #264653); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .booking-box { background: #f8f9fa; border-left: 4px solid #2A9D8F; padding: 20px; margin: 20px 0; }
            .payment-box { background: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #264653; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>🎉 Booking Confirmed!</h1><p>${data.siteName}</p></div>
            <div class="content">
                <p>Hi <strong>${data.guestName}</strong>,</p>
                <p>Great news! Your stay at <strong>${data.roomName}</strong> has been officially confirmed.</p>
                <div class="booking-box">
                    <h3>📋 Reservation Details</h3>
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                    <p><strong>Check-in:</strong> ${data.checkIn}</p>
                    <p><strong>Check-out:</strong> ${data.checkOut}</p>
                </div>
                <div class="payment-box">
                    <h3>💰 Payment Status</h3>
                    <p><strong>Total Price:</strong> ₱${data.totalPrice?.toLocaleString()}</p>
                    <p>We've received your payment/deposit. See you soon!</p>
                </div>
                <p>Need help? Contact us at ${data.contactEmail}.</p>
                <p>Warm regards,<br><strong>${data.siteName} Team</strong></p>
            </div>
            <div class="footer"><p>© ${data.siteName} | Thank you for choosing us!</p></div>
        </div>
    </body>
    </html>
    `;
}

export default async (req: Request) => {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    const requestId = url.searchParams.get('requestId');
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    const id = bookingId || requestId;

    if (!id || !action || !token) {
        return new Response('Missing parameters', { status: 400 });
    }

    if (!validateToken(id, token)) {
        return new Response('Invalid or expired link', { status: 403 });
    }

    try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        let title = '';
        let message = '';
        let subMessage = '';

        // --- RENEWAL ACTIONS ---
        if (action === 'approve-renewal' || action === 'reject-renewal') {
            const requestRef = doc(db, '_superadmin', 'renewals', 'requests', id);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) return new Response('Renewal request not found', { status: 404 });
            const requestData = requestSnap.data();

            if (action === 'approve-renewal') {
                const subRef = doc(db, '_superadmin', 'subscription');
                const subSnap = await getDoc(subRef);
                const currentExpiry = subSnap.exists() && subSnap.data().expiresAt
                    ? new Date(subSnap.data().expiresAt)
                    : new Date();
                
                const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                const newExpiry = new Date(baseDate);
                newExpiry.setDate(newExpiry.getDate() + (requestData.daysRequested || 30));

                await updateDoc(subRef, {
                    expiresAt: newExpiry.toISOString().split('T')[0],
                    lastModified: new Date().toISOString()
                });

                await updateDoc(requestRef, {
                    status: 'approved',
                    approvedAt: new Date().toISOString()
                });

                title = '✅ Subscription Activated!';
                message = `Successfully extended ${requestData.clientName}'s plan by ${requestData.daysRequested} days.`;
                subMessage = `New expiry: ${newExpiry.toLocaleDateString()}`;
            } else {
                await updateDoc(requestRef, { status: 'rejected', rejectedAt: new Date().toISOString() });
                title = '❌ Request Rejected';
                message = `The renewal request for ${requestData.clientName} has been rejected.`;
            }
        } 
        // --- BOOKING ACTIONS ---
        else {
            const bookingRef = doc(db, 'bookings', id);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) return new Response('Booking not found', { status: 404 });
            const bookingData = bookingSnap.data();

            if (action === 'approve') {
                await updateDoc(bookingRef, { status: 'confirmed' });
                
                try {
                    const guestHtml = generateUserEmailHTML({
                        guestName: bookingData.guestName,
                        roomName: bookingData.roomName,
                        checkIn: bookingData.checkIn,
                        checkOut: bookingData.checkOut,
                        bookingId: bookingData.shortId || bookingData.id,
                        totalPrice: bookingData.totalPrice,
                        siteName: bookingData.siteName || 'Serenity Staycation',
                        contactEmail: 'visionarywebco@gmail.com'
                    });

                    await transporter.sendMail({
                        from: `"System" <visionarywebco@gmail.com>`,
                        to: bookingData.email,
                        subject: `🎉 Booking Confirmed - ${bookingData.roomName}`,
                        html: guestHtml
                    });
                    
                    title = '✅ Booking Confirmed!';
                    message = `Guest ${bookingData.guestName} has been notified.`;
                } catch (e) {
                    title = '✅ Confirmed (Email Failed)';
                    message = 'Booking was confirmed, but the guest notification email failed.';
                }

                const checkInDate = new Date(bookingData.checkIn);
                const today = new Date();
                today.setHours(0,0,0,0);
                if (checkInDate < today) {
                    subMessage = `⚠️ <b>HEADS UP:</b> This booking was for a past date (${checkInDate.toLocaleDateString()}). You may want to contact the guest to reschedule.`;
                }
            } else if (action === 'reject') {
                await updateDoc(bookingRef, { status: 'cancelled' });
                title = '❌ Booking Rejected';
                message = `Guest ${bookingData.guestName}'s booking has been rejected.`;
            }
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f3f4f6; }
                    .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 450px; width: 90%; }
                    h1 { color: #1f2937; margin-bottom: 0.75rem; font-size: 1.75rem; }
                    p { color: #4b5563; font-size: 1.1rem; margin-bottom: 2rem; }
                    .warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 1rem; border-radius: 0.75rem; font-size: 0.95rem; margin-bottom: 2rem; text-align: left; }
                    .btn { background: #2A9D8F; color: white !important; padding: 0.85rem 2rem; border-radius: 0.75rem; text-decoration: none; font-weight: bold; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>${title}</h1>
                    <p>${message}</p>
                    ${subMessage ? `<div class="warning">${subMessage}</div>` : ''}
                    <a href="javascript:window.close()" class="btn">Close Window</a>
                </div>
            </body>
            </html>
        `;

        return new Response(html, { headers: { 'Content-Type': 'text/html' } });

    } catch (error: any) {
        return new Response('Internal Server Error: ' + error.message, { status: 500 });
    }
};
