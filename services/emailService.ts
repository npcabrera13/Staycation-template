// Email Service - Uses Nodemailer via Vercel API route
// Unlimited emails through SMTP

import { Booking, Room, Settings } from '../types';

interface EmailData {
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
}

/**
 * Send email via Nodemailer API route
 */
async function sendEmail(
    to: string,
    subject: string,
    type: 'user_confirmation' | 'admin_notification',
    data: EmailData
): Promise<boolean> {
    try {
        console.log(`📧 Sending ${type} email to:`, to);

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, type, data })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Email API error:', result.error);
            return false;
        }

        console.log('✅ Email sent successfully:', result.messageId);
        return true;

    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}

/**
 * Send booking confirmation email to guest
 */
export async function sendUserConfirmationEmail(
    booking: Booking,
    room: Room,
    settings: Settings
): Promise<boolean> {
    const depositAmount = calculateDeposit(booking.totalPrice, settings);
    const balanceAmount = booking.totalPrice - depositAmount;

    const data: EmailData = {
        guestName: booking.guestName,
        roomName: room.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        nights: booking.nights,
        totalPrice: booking.totalPrice,
        depositAmount: settings.reservationPolicy?.requireDeposit ? depositAmount : undefined,
        balanceAmount: settings.reservationPolicy?.requireDeposit ? balanceAmount : undefined,
        bookingId: booking.shortId || booking.id,
        siteName: settings.siteName || 'Serenity Staycation',
        contactEmail: settings.contact?.email,
        contactPhone: settings.contact?.phone,
        paymentDeadline: settings.reservationPolicy?.paymentDeadlineHours
            ? `${settings.reservationPolicy.paymentDeadlineHours} hours`
            : undefined
    };

    return sendEmail(
        booking.email,
        `Booking Received - ${room.name}`,
        'user_confirmation',
        data
    );
}

/**
 * Send notification email to admin about new booking
 */
export async function sendAdminNotificationEmail(
    booking: Booking,
    room: Room,
    settings: Settings
): Promise<boolean> {
    const adminEmail = settings.notifications?.adminEmail;

    if (!adminEmail) {
        console.log('⚠️ No admin email configured, skipping admin notification');
        return false;
    }

    const depositAmount = calculateDeposit(booking.totalPrice, settings);

    const data: EmailData = {
        guestName: booking.guestName,
        roomName: room.name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        nights: booking.nights,
        totalPrice: booking.totalPrice,
        depositAmount: settings.reservationPolicy?.requireDeposit ? depositAmount : undefined,
        bookingId: booking.shortId || booking.id,
        siteName: settings.siteName || 'Serenity Staycation'
    };

    return sendEmail(
        adminEmail,
        `🔔 New Booking from ${booking.guestName}`,
        'admin_notification',
        data
    );
}

/**
 * Calculate deposit amount
 */
export function calculateDeposit(totalPrice: number, settings: Settings): number {
    if (!settings.reservationPolicy?.requireDeposit) {
        return 0;
    }

    if (settings.reservationPolicy.depositType === 'fixed') {
        return Math.min(settings.reservationPolicy.fixedDepositAmount || 0, totalPrice);
    }

    const percentage = settings.reservationPolicy.depositPercentage || 50;
    return Math.round(totalPrice * (percentage / 100));
}

/**
 * Calculate balance
 */
export function calculateBalance(totalPrice: number, depositAmount: number): number {
    return totalPrice - depositAmount;
}
