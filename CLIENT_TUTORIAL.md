# 🏖️ Staycation Booking System — Client Tutorial

> **Welcome!** This guide will walk you through everything you need to know to set up, customize, and manage your staycation booking website.

---

## Table of Contents

1. [How the System Works](#how-the-system-works)
2. [Getting Started — First-Time Setup](#getting-started)
3. [The Visual Builder — Customize Your Website](#visual-builder)
4. [Admin Dashboard — Manage Your Business](#admin-dashboard)
5. [Room Management](#room-management)
6. [Booking Flow — How Guests Book](#booking-flow)
7. [Payment Setup](#payment-setup)
8. [Admin Settings](#admin-settings)
9. [Day Use vs Overnight Bookings](#day-use-vs-overnight)
10. [Tips & Best Practices](#tips)

---

## 1. How the System Works <a name="how-the-system-works"></a>

Your website has **3 main parts**:

| Area | Who Uses It | How to Access |
|------|------------|---------------|
| **Homepage** | Your guests / customers | Visit your website URL |
| **Admin Dashboard** | You (the business owner) | Click "Admin" in the navbar or go to `yoursite.com/#admin` |
| **Visual Builder** | You (to customize the look) | From Admin Dashboard → click "Edit Homepage" |

### The Guest Journey:
```
Guest visits your website
    → Browses available rooms
    → Clicks "Book Now" on a room
    → Selects dates on the calendar
    → Fills in their details (name, email, phone)
    → Sees total price
    → Proceeds to payment (scans QR code)
    → Submits booking request
    → You receive the booking in your Admin Dashboard
    → You confirm/reject it
```

---

## 2. Getting Started — First-Time Setup <a name="getting-started"></a>

### Step 1: Access the Admin Dashboard
- Open your website and click **"Admin"** in the navigation bar
- Enter your **admin passcode** (you set this in Settings)

### Step 2: Add Your Rooms
- Go to the **Rooms** tab
- Click **"+ Add Room"**
- Fill in:
  - **Room Name** (e.g., "Sunset Villa Beachfront")
  - **Description** — what makes this room special
  - **Price per Night** (e.g., ₱3,500)
  - **Day Use Price** (optional — e.g., ₱1,500 for daytime-only guests)
  - **Capacity** — max number of guests
  - **Room Image** — upload a beautiful photo
  - **Amenities** — add items like Pool, AC, WiFi, etc.

### Step 3: Set Up Payment
- Go to the **Settings** tab
- Scroll to **Payment Methods**
- Upload your **GCash QR code** and/or **Bank Transfer QR code**
- Add your account name and number so guests know where to send

### Step 4: Customize Your Website
- Click **"Edit Homepage"** to open the Visual Builder
- Change your hero text, images, colors, and more (see Section 3)

---

## 3. The Visual Builder — Customize Your Website <a name="visual-builder"></a>

The Visual Builder lets you customize your website **without any coding**.

### How to Open It
1. Go to the **Admin Dashboard**
2. Click **"Edit Homepage"** (or the pencil icon)
3. A toolbar will appear on the left side of your screen

### What You Can Customize

| Feature | How |
|---------|-----|
| **Text** | Click directly on any text on the page to edit it |
| **Images** | Click on any image to replace it with your own |
| **Colors / Theme** | Use the color pickers in the toolbar to change your brand colors |
| **Buttons** | Click on buttons to change their text and links |
| **Google Maps** | Update your map embed code in the builder toolbar |
| **General Info** | Edit your property name, tagline, and about section |

### Tips for the Visual Builder
- 📝 **Click to edit** — most text and images are directly clickable
- 🎨 **Theme colors** — changing the primary color will update buttons, accents, and highlights across the entire site
- 💾 **Save often** — click the Save button in the toolbar after making changes
- 🔄 **Preview** — minimize the builder toolbar to see how your site looks to guests

---

## 4. Admin Dashboard — Manage Your Business <a name="admin-dashboard"></a>

The Admin Dashboard has **4 main tabs**:

### 📅 Calendar Tab
- See all bookings on a visual calendar
- Color-coded by status:
  - 🟡 **Pending** — waiting for your approval
  - 🟢 **Confirmed** — you approved this booking
  - 🔴 **Cancelled** — booking was cancelled
- Click on any booking to view details or take action

### 📊 Overview Tab
- Quick summary of your business stats
- See total bookings, revenue, occupancy rates
- View recent booking activity
- Export booking reports

### 🏠 Rooms Tab
- Add, edit, or remove rooms
- Update prices, photos, amenities, and capacity
- Set Day Use prices for rooms that offer daytime bookings

### ⚙️ Settings Tab
- **Payment Methods** — set up GCash/Bank QR codes
- **Deposit Settings** — configure deposit amounts or percentages
- **Check-in/Check-out Times** — set default times
- **Admin Passcode** — secure your dashboard
- **Booking Notifications** — configure how you get notified

---

## 5. Room Management <a name="room-management"></a>

### Adding a New Room
1. Go to **Rooms** tab → click **"+ Add Room"**
2. Fill in all the details
3. Upload at least **one room photo** (more photos = better!)
4. Add amenities (Pool, AC, WiFi, Kitchen, Balcony, etc.)
5. Click **Save**

### Setting Prices
- **Price per Night** — the standard overnight rate
- **Day Use Price** (optional) — a separate, usually lower rate for guests who only want to use the room during the day (no overnight stay)

### Editing a Room
- Click the **Edit** (pencil) icon on any room card
- Make your changes and save

### Deleting a Room
- Click the **Delete** (trash) icon on the room card
- Confirm the deletion

> ⚠️ **Note:** Deleting a room will NOT delete existing bookings for that room.

---

## 6. Booking Flow — How Guests Book <a name="booking-flow"></a>

Here's exactly what your guests experience:

### Step 1: Select a Room
- Guest scrolls to the **Rooms** section on your homepage
- Clicks **"Book Now"** on their preferred room

### Step 2: Choose Dates
- A booking modal opens with a **calendar**
- Guest clicks their **check-in date**, then their **check-out date**
- The system automatically calculates the number of nights and total price
- If the room has a **Day Use** option and the guest only selects one date → it automatically switches to Day Use pricing

### Step 3: Fill In Details
- Full Name
- Email Address
- Phone Number
- Number of Guests
- Preferred check-in and check-out times

### Step 4: Review & Pay
- Guest sees a **booking summary** with all the details
- They choose to pay **deposit only** or **full amount**
- They scan the **QR code** to make payment via GCash or bank transfer
- After paying, they click **"Confirm Booking"**

### Step 5: Booking Submitted
- Guest receives a **booking reference number**
- The booking appears in **your Admin Dashboard** as "Pending"
- You review and **confirm** or **reject** the booking

---

## 7. Payment Setup <a name="payment-setup"></a>

### Setting Up GCash
1. Go to **Admin Dashboard** → **Settings**
2. Find the **Payment Methods** section
3. Enable **GCash**
4. Upload your **GCash QR code** image
5. Enter your **account name** and **account number**

### Setting Up Bank Transfer
1. In the same Payment Methods section
2. Enable **Bank Transfer**
3. Upload your **Bank QR code** image
4. Enter your **bank name**, **account name**, and **account number**

### Setting Up Deposits
- You can require guests to pay a **deposit** instead of the full amount
- Set the deposit as a **fixed amount** (e.g., ₱500) or a **percentage** (e.g., 50%)
- Guests can choose to pay the deposit or the full amount at checkout

> 💡 **Tip:** Using deposits lowers the barrier for guests to book, while still securing their reservation.

---

## 8. Admin Settings <a name="admin-settings"></a>

### Admin Passcode
- Go to **Settings** → **Admin Passcode**
- Set a numeric passcode to protect your dashboard
- Share this code **only** with authorized staff

### Check-in / Check-out Times
- Set your default check-in time (e.g., 2:00 PM)
- Set your default check-out time (e.g., 12:00 PM)
- Guests can adjust these within reason when booking

### Managing Bookings
When a new booking comes in:
1. Check your **Calendar** tab — new bookings appear as "Pending"
2. Click on the booking to view details
3. Verify the guest's payment (they should send you a screenshot)
4. Click **"Confirm"** to approve or **"Cancel"** to reject
5. The guest receives a notification about their booking status

---

## 9. Day Use vs Overnight Bookings <a name="day-use-vs-overnight"></a>

Your system supports **two types of bookings**:

### 🌞 Day Use
- Guest uses the room **during the day only** (no overnight stay)
- Charged at the **Day Use Price** (usually lower)
- Guest selects **one date** on the calendar → system automatically detects Day Use
- Perfect for: pool day, party venue, work-from-villa, etc.

### 🌙 Overnight Stay
- Guest stays **one or more nights**
- Charged at the **Price per Night × number of nights**
- Guest selects a **check-in date** then a **check-out date**

### How to Enable Day Use
1. Go to **Rooms** tab → **Edit** a room
2. Set a **Day Use Price** (e.g., ₱1,500)
3. Save the room
4. Now when guests select just one date, it'll automatically book as Day Use!

> 💡 If you **don't set** a Day Use Price, the room will only allow overnight bookings.

---

## 10. Tips & Best Practices <a name="tips"></a>

### 📸 Photos Matter
- Use **high-quality photos** of your property
- Show different angles: exterior, bedroom, bathroom, pool, view
- The first photo is the most important — it appears on the room card

### 💰 Pricing Strategy
- Set competitive prices based on your area
- Day Use pricing should be **lower** than overnight (usually 30-50% of the nightly rate)
- Consider offering deposit options to increase booking conversions

### 📱 Mobile-Friendly
- Your website is fully responsive — it looks great on phones, tablets, and computers
- Most of your guests will book from their **mobile phones**, so test the experience yourself!

### 🔔 Stay Responsive
- Check your Admin Dashboard **regularly** for new bookings
- Confirm bookings **quickly** — guests appreciate fast responses
- Guests expect a confirmation within **a few hours**

### 🎨 Branding
- Use the Visual Builder to match your website to your brand colors
- Upload your logo and use consistent imagery
- Write compelling descriptions for your rooms — sell the experience!

---

## Need Help?

If you have any questions or need assistance:
- Contact your developer/provider
- Refer back to this guide anytime

**Happy hosting! 🏖️**
