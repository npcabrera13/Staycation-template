import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { WorkerMailer } from 'worker-mailer';

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT & TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Env {
    SMTP_EMAIL: string;
    SMTP_PASSWORD: string;
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO: Web Crypto API (replaces Node.js crypto module)
// ═══════════════════════════════════════════════════════════════════════════

async function validateToken(id: string, token: string, secret: string): Promise<boolean> {
    const msg = id + secret;
    const msgBuffer = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expected = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return token === expected;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUEST CONFIRMATION EMAIL TEMPLATE
// (Sent automatically when admin clicks "Approve" from their email)
// ═══════════════════════════════════════════════════════════════════════════

function generateUserEmailHTML(data: any): string {
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
                <h1>🎉 Booking Confirmed!</h1>
                <p style="margin: 10px 0 0;">${data.siteName}</p>
            </div>
            
            <div class="content">
                <p>Hi <strong>${data.guestName}</strong>,</p>
                <p>Great news! Your reservation for <strong>${data.roomName}</strong> has been <strong style="color: #059669;">confirmed</strong>.</p>
                
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
                    <p><strong>Total Amount:</strong> ₱${data.totalPrice?.toLocaleString() || '0'}</p>
                </div>
                
                <p>If you have any questions, contact us at <strong>${data.contactEmail || 'our email'}</strong>.</p>
                
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

// ═══════════════════════════════════════════════════════════════════════════
// CLOUDFLARE PAGES FUNCTION HANDLER — GET requests from email action links
// ═══════════════════════════════════════════════════════════════════════════

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('bookingId');
    const requestId = url.searchParams.get('requestId');
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');

    const id = (bookingId || requestId) as string;

    if (!id || !action || !token) {
        return new Response('Missing parameters', { status: 400 });
    }

    // ── Security: Validate the SHA-256 token ────────────────────────────────
    const SECRET = env.VITE_FIREBASE_APP_ID || 'staycation-secret-salt';

    if (!(await validateToken(id, token, SECRET))) {
        return new Response('Invalid or expired link', { status: 403 });
    }

    try {
        // ── Initialize Firebase ─────────────────────────────────────────────
        const firebaseConfig = {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: env.VITE_FIREBASE_APP_ID
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);

        let message = '';
        let subMessage = '';
        let title = '';

        // ═════════════════════════════════════════════════════════════════════
        // RENEWAL ACTIONS (Superadmin approves/rejects a subscription renewal)
        // ═════════════════════════════════════════════════════════════════════
        if (action === 'approve-renewal' || action === 'reject-renewal') {
            const requestRef = doc(db, '_superadmin', 'renewals', 'requests', id);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) {
                return new Response('Renewal request not found', { status: 404 });
            }
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
        // ═════════════════════════════════════════════════════════════════════
        // BOOKING ACTIONS (Admin approves/rejects a guest booking)
        // ═════════════════════════════════════════════════════════════════════
        else {
            const bookingRef = doc(db, 'bookings', id);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) {
                return new Response('Booking not found', { status: 404 });
            }
            const bookingData = bookingSnap.data();
            const currentStatus = bookingData.status;

            if (action === 'approve') {
                if (currentStatus === 'confirmed') {
                    title = 'Already Confirmed';
                    message = 'This booking was already confirmed previously.';
                } else {
                    // 1. Update Firestore status
                    await updateDoc(bookingRef, { status: 'confirmed' });

                    // 2. Send automatic confirmation email to guest via worker-mailer
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
                            contactEmail: env.SMTP_EMAIL || 'our email'
                        };

                        const guestHtml = generateUserEmailHTML(emailData);

                        const mailer = await WorkerMailer.connect({
                            credentials: {
                                username: env.SMTP_EMAIL,
                                password: env.SMTP_PASSWORD,
                            },
                            authType: 'plain',
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: true,
                        });

                        await mailer.send({
                            from: { name: 'System', email: env.SMTP_EMAIL },
                            to: { email: bookingData.email },
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

                    // 3. Check for overdue/past check-in date
                    const checkInDate = new Date(bookingData.checkIn);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (checkInDate < today) {
                        subMessage = `⚠️ <b>HEADS UP:</b> This booking was for a past date (${checkInDate.toLocaleDateString()}). You may want to contact the guest to reschedule.`;
                    }
                }
            } else if (action === 'reject') {
                await updateDoc(bookingRef, { status: 'cancelled' });
                title = '❌ Booking Rejected';
                message = `Guest ${bookingData.guestName}'s booking has been rejected.`;
            } else {
                return new Response('Invalid action', { status: 400 });
            }
        }

        // ═════════════════════════════════════════════════════════════════════
        // RESPONSE: Pretty HTML feedback page
        // ═════════════════════════════════════════════════════════════════════
        const responseHtml = `
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
        `;

        return new Response(responseHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Error in booking-action:', error);
        return new Response('An error occurred while processing the request.', { status: 500 });
    }
};
