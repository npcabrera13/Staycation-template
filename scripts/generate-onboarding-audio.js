import { EdgeTTS } from 'edge-tts-universal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define steps and substeps matching AdminOnboarding.tsx exactly
const steps = [
    {
        id: 'overview',
        substeps: [
            {
                instruction: 'Monitor key metrics at the top',
                tip: 'Revenue, Occupancy, Active Guests, and Pending Bookings update in real-time as guests book.',
            },
            {
                instruction: 'Manage bookings in the Recent Bookings list',
                tip: 'Shows detailed guest profiles, checkout choices, and status changes at a glance.',
            }
        ]
    },
    {
        id: 'deposit',
        substeps: [
            {
                instruction: 'Understand what the Deposit is for',
                tip: 'Deposits cover cleaning fees, accidental room damages, and deter fake bookings. Guests pay this to you directly via GCash.',
            },
            {
                instruction: 'Configure your Global Deposit rule',
                tip: 'Set it as a fixed amount or a percentage in the Rooms tab. Guests pay just this to secure dates.',
            },
            {
                instruction: 'Verify guest transfer slips',
                tip: 'After a guest books, they upload a GCash receipt. Review it on their booking card before confirming!',
            }
        ]
    },
    {
        id: 'payment',
        substeps: [
            {
                instruction: 'Enter your GCash Account Name',
                tip: 'The registered name on your GCash account (e.g., Juan Dela Cruz)',
            },
            {
                instruction: 'Enter your GCash Account Number',
                tip: 'Your 11-digit GCash number (e.g., 09171234567)',
            },
            {
                instruction: 'Scroll down and hit Save to lock in your payout details',
                tip: 'Your payment info will be shown to guests after they book',
            }
        ]
    },
    {
        id: 'rooms',
        substeps: [
            {
                instruction: 'Tap Add Room to create a new listing',
                tip: 'Set occupancy limits, room description, and modern amenities (e.g. Pool, WiFi).',
            },
            {
                instruction: 'Click the Edit button on your first room',
                tip: 'This opens the room editor where you can customize descriptions, amenities, and photos.',
            },
            {
                instruction: 'Upload high-quality room photos',
                tip: 'Add multiple photos showing different angles of the bed, bathroom, and views.',
            },
            {
                instruction: 'Set nightly and day-use rates',
                tip: 'Charge competitive rates for overnight stays, and set custom weekend markups if desired.',
            }
        ]
    },
    {
        id: 'passcode',
        substeps: [
            {
                instruction: 'Scroll to the Security section in settings',
                tip: 'Here you will find the 6-digit passcode option which controls panel access.',
            },
            {
                instruction: 'Set a custom 6-digit passcode',
                tip: 'Replace the default code with a secure custom combination. Make sure to remember it!',
            },
            {
                instruction: 'Test the automatic logout',
                tip: 'Logging out locks the panel with an encrypted passcode gate. Anyone visiting admin must enter it to view stats.',
            }
        ]
    },
    {
        id: 'workflow',
        substeps: [
            {
                instruction: '1. Guest Submits Pending Request',
                tip: 'Bookings start as Pending. An email and dashboard alert warn you. The dates are temporarily held.',
            },
            {
                instruction: '2. Verify Payment and Click Confirm',
                tip: 'Verify they paid the required deposit or full amount via GCash. Open their reservation card, check their screenshot, and click Confirm!',
            },
            {
                instruction: '3. Welcome Guest and Mark Checked-In',
                tip: 'When guests arrive at your property, click Check In to update their status. Collect any remaining cash balances.',
            },
            {
                instruction: '4. Verify Room and Mark Checked-Out',
                tip: 'Upon departure, check the room for damages. Refund their security deposit, and click Check Out to open the dates for future guests!',
            }
        ]
    },
    {
        id: 'logo',
        substeps: [
            {
                instruction: 'Locate the default logo in the top left corner',
                tip: 'Your logo appears in the navigation bar on every page.',
            },
            {
                instruction: 'Click the logo to open the media picker and upload yours',
                tip: 'Use a clear PNG with a transparent background for best results!',
            }
        ]
    },
    {
        id: 'builder',
        substeps: [
            {
                instruction: 'Double-click any headline text to edit it inline',
                tip: 'Works on all headlines, taglines, descriptions, and button text throughout the entire page!',
            },
            {
                instruction: 'Open the Hero Section panel and upload your banner images',
                tip: 'Click the sidebar Hero Section accordion to add, replace, or remove hero slider images.',
            },
            {
                instruction: 'Click Adjust Image to drag-reposition your hero photo',
                tip: 'Drag your hero image to frame the perfect crop. Use the zoom slider for close-ups!',
            },
            {
                instruction: 'Set overlay opacity and text shadow for readability',
                tip: 'Darken the hero background so white text pops, and add soft or strong text shadows.',
            }
        ]
    },
    {
        id: 'features',
        substeps: [
            {
                instruction: 'Scroll to the "Why Choose Us" section',
                tip: 'It\'s right below the hero banner. Here you can highlight key selling points.',
            },
            {
                instruction: 'Click "+ Add Point" to create a new feature',
                tip: 'Add things like "High-Speed WiFi", "Private Pool", or "Free Breakfast".',
            },
            {
                instruction: 'Click any icon to change it',
                tip: 'Choose from a library of professional icons to match your feature.',
            }
        ]
    },
    {
        id: 'gallery',
        substeps: [
            {
                instruction: 'Scroll down to find the photo gallery section',
                tip: 'The gallery is in the About section — it shows a mosaic of your property photos.',
            },
            {
                instruction: 'Click any image or the Manage Gallery button to open the editor',
                tip: 'Choose from 5 different layouts: Classic Mosaic, 2-Column, 3-Column, Grid, or Panorama!',
            },
            {
                instruction: 'Upload custom photos and reposition them',
                tip: 'Drag to reposition each photo, use zoom to adjust, or toggle Inherit from Rooms to auto-pull room photos.',
            }
        ]
    },
    {
        id: 'social',
        substeps: [
            {
                instruction: 'The Social and Links panel will auto-open in the sidebar',
                tip: 'This panel has toggle switches for Facebook, Instagram, TikTok, X, Airbnb, and custom links.',
            },
            {
                instruction: 'Toggle ON or OFF which social icons appear in your footer',
                tip: 'Enable the platforms you use, disable the ones you don\'t — empty links are hidden from visitors.',
            },
            {
                instruction: 'Scroll to the footer and click any social icon to paste your URL',
                tip: 'Click a social icon in the footer (e.g. Facebook) to open the URL editor popup.',
            }
        ]
    },
    {
        id: 'map',
        substeps: [
            {
                instruction: 'Scroll to the Our Location section and hover over the map',
                tip: 'In edit mode, hovering the map reveals the location setup options.',
            },
            {
                instruction: 'Click Search for Your Resort Location and type your address',
                tip: 'The built-in search will find your resort on Google Maps and auto-embed it!',
            },
            {
                instruction: 'Or paste a Google Maps embed code if search doesn\'t find your spot',
                tip: 'Go to maps.google.com, Share, Embed, Copy the iframe code and paste it here.',
            }
        ]
    },
    {
        id: 'design',
        substeps: [
            {
                instruction: 'The Theme and Colors panel will auto-open in the sidebar',
                tip: 'Browse through 18 luxury preset palettes or create your own custom brand.',
            },
            {
                instruction: 'Click any preset theme to instantly apply it',
                tip: 'Try Navy and Gold for a luxury feel, Ocean Breeze for tropical, or Emerald Luxe for nature vibes!',
            },
            {
                instruction: 'Use the color pickers to set Primary, Hover, and Secondary colors',
                tip: 'Scroll below the presets to find individual color pickers for full custom control.',
            },
            {
                instruction: 'Change the Global Font at the bottom of the theme panel',
                tip: 'Choose from Sans-Serif (modern), Serif (elegant), or Monospace (typewriter) typography.',
            }
        ]
    }
];

// Initialise file list with welcome and celebration screens
const audioFiles = [
    {
        filename: 'welcome.mp3',
        text: "Welcome to Staycation! Let's configure your property. Click Let's Begin or Watch Video Guide to start."
    },
    {
        filename: 'celebrate.mp3',
        text: "Congratulations! Your staycation website is fully set up, styled, and ready to take bookings. Great job!"
    }
];

// Dynamically generate entries for all sub-steps
steps.forEach((step, stepIdx) => {
    step.substeps.forEach((sub, subIdx) => {
        audioFiles.push({
            filename: `step-${stepIdx + 1}-sub-${subIdx + 1}.mp3`,
            text: `${sub.instruction}. ${sub.tip || ''}`
        });
    });
});

async function generateAll() {
    const outputDir = path.resolve(__dirname, '../public/audio/onboarding');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`🎙️ Starting Premium Onboarding Audio pre-generation using Microsoft Edge Neural Voice...`);
    console.log(`📂 Output directory: ${outputDir}`);
    console.log(`📦 Total files to generate: ${audioFiles.length}\n`);

    for (let i = 0; i < audioFiles.length; i++) {
        const item = audioFiles[i];
        const filePath = path.join(outputDir, item.filename);
        
        console.log(`[${i + 1}/${audioFiles.length}] Synthesizing "${item.filename}"...`);
        console.log(`💬 Text: "${item.text}"`);

        try {
            // Instantiate EdgeTTS with text and Aria voice
            const tts = new EdgeTTS(item.text, 'en-US-AriaNeural');
            const result = await tts.synthesize();
            
            // Convert Blob to ArrayBuffer, then to Buffer for fs writing
            const arrayBuffer = await result.audio.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            console.log(`✅ Saved successfully to ${item.filename}\n`);
            
            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`❌ Failed to generate "${item.filename}":`, error);
        }
    }

    // Optional: Clean up old chapter-level mp3s if they exist to keep public clean
    for (let sIdx = 1; sIdx <= 10; sIdx++) {
        const oldFile = path.join(outputDir, `step-${sIdx}.mp3`);
        if (fs.existsSync(oldFile)) {
            try {
                fs.unlinkSync(oldFile);
                console.log(`🧹 Cleaned up old file: step-${sIdx}.mp3`);
            } catch (e) {
                // Ignore errors
            }
        }
    }

    console.log('\n🎉 Audio pre-generation complete! All premium sub-step MP3s saved successfully.');
}

generateAll().catch(err => {
    console.error('Fatal error during audio generation:', err);
    process.exit(1);
});
