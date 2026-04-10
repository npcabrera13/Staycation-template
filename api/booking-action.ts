import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

import { transporter, generateUserEmailHTML } from './send-email';

// Re-use Firebase config from env
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Use VITE_FIREBASE_APP_ID as the secret salt for tokens
const SECRET = process.env.VITE_FIREBASE_APP_ID || 'staycation-secret-salt';

function validateToken(id: string, token: string): boolean {
    const expected = crypto
        .createHash('sha256')
        .update(id + SECRET)
        .digest('hex');
    return token === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { bookingId, requestId, action, token } = req.query;
    const id = (bookingId || requestId) as string;

    if (!id || !action || !token) {
        return res.status(400).send('Missing parameters');
    }

    // Security check
    if (!validateToken(id, token as string)) {
        return res.status(403).send('Invalid or expired link');
    }

    try {
        // Initialize Firebase (if not already)
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        let message = '';
        let subMessage = '';
        let title = '';

        // --- RENEWAL ACTIONS ---
        if (action === 'approve-renewal' || action === 'reject-renewal') {
            const requestRef = doc(db, '_superadmin', 'renewals', 'requests', id);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) return res.status(404).send('Renewal request not found');
            const requestData = requestSnap.data();

            if (action === 'approve-renewal') {
                // 1. Extend Subscription
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

                // 2. Mark request as approved
                await updateDoc(requestRef, {
                    status: 'approved',
                    approvedAt: new Date().toISOString()
                });

                title = '✅ Subscription Activated!';
                message = `Successfully extended ${requestData.clientName}'s plan by ${requestData.daysRequested} days.`;
                subMessage = `New expiry: ${newExpiry.toLocaleDateString()}`;
            } else {
                await updateDoc(requestRef, {
                    status: 'rejected',
                    rejectedAt: new Date().toISOString()
                });
                title = '❌ Request Rejected';
                message = `The renewal request for ${requestData.clientName} has been rejected.`;
            }
        } 
        // --- BOOKING ACTIONS ---
        else {
            const bookingRef = doc(db, 'bookings', id);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) return res.status(404).send('Booking not found');
            const bookingData = bookingSnap.data();
            const currentStatus = bookingData.status;

            if (action === 'approve') {
                if (currentStatus === 'confirmed') {
                    title = 'Already Confirmed';
                    message = 'This booking was already confirmed previously.';
                } else {
                    // 1. Update Firestore
                    await updateDoc(bookingRef, { status: 'confirmed' });

                    // 2. Send automatic confirmation email to guest
                    try {
                        const emailData = {
                            guestName: bookingData.guestName,
                            roomName: bookingData.roomName,
                            checkIn: bookingData.checkIn,
                            checkOut: bookingData.checkOut,
                            guests: bookingData.guests,
                            nights: bookingData.nights,
                            totalPrice: bookingData.totalPrice,
                            bookingId: bookingData.shortId || bookingData.id,
                            siteName: bookingData.siteName || 'Serenity Staycation',
                            contactEmail: process.env.SMTP_EMAIL || 'visionarywebco@gmail.com'
                        };

                        const guestHtml = generateUserEmailHTML(emailData as any);
                        await transporter.sendMail({
                            from: `"System" <visionarywebco@gmail.com>`,
                            to: bookingData.email,
                            subject: `🎉 Booking Confirmed - ${bookingData.roomName}`,
                            html: guestHtml
                        });
                        
                        title = '✅ Booking Confirmed!';
                        message = `Guest ${bookingData.guestName} has been notified.`;
                    } catch (emailErr) {
                        console.error('Failed to send guest confirmation:', emailErr);
                        title = '✅ Confirmed (Email Failed)';
                        message = 'Booking was confirmed, but the guest notification email failed to send.';
                    }

                    // 3. Check for Overdue
                    const checkInDate = new Date(bookingData.checkIn);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    if (checkInDate < today) {
                        subMessage = `⚠️ <b>HEADS UP:</b> This booking was for a past date (${checkInDate.toLocaleDateString()}). You may want to contact the guest to reschedule.`;
                    }
                }
            } else if (action === 'reject') {
                await updateDoc(bookingRef, { status: 'cancelled' });
                title = '❌ Booking Rejected';
                message = `Guest ${bookingData.guestName}'s booking has been rejected.`;
            } else {
                return res.status(400).send('Invalid action');
            }
        }

        // Final HTML Response
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f3f4f6; }
                    .card { background: white; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); text-align: center; max-width: 450px; width: 90%; margin: 20px; }
                    h1 { color: #1f2937; margin-bottom: 0.75rem; font-size: 1.75rem; }
                    p { color: #4b5563; font-size: 1.1rem; line-height: 1.5; margin-bottom: 2rem; }
                    .warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 1rem; border-radius: 0.75rem; font-size: 0.95rem; margin-bottom: 2rem; text-align: left; }
                    .btn { background: #2A9D8F; color: white !important; padding: 0.85rem 2rem; border-radius: 0.75rem; text-decoration: none; font-weight: bold; display: inline-block; transition: transform 0.2s; }
                    .btn:hover { transform: scale(1.02); }
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
        `);

    } catch (error) {
        console.error('Error in booking-action:', error);
        return res.status(500).send('An error occurred while processing the request.');
    }
}
