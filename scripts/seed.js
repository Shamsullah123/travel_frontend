const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load env vars manually since it's a script
require('dotenv').config({ path: '.env.local' });

// Define Schemas inline to avoid import issues in standalone script
const AgencySchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'Active' },
    subscriptionPlan: { type: String, default: 'Basic' },
    contactInfo: { phone: String, email: String, address: String },
    branding: { logoUrl: String },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    agencyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'Staff' },
    name: { type: String, required: true },
    permissions: [String],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Agency = mongoose.models.Agency || mongoose.model('Agency', AgencySchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error("Please provide MONGODB_URI in .env.local");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // 1. Create Default Agency
    const agencyName = "Bannu Pilot Travels";
    let agency = await Agency.findOne({ name: agencyName });
    if (!agency) {
        agency = await Agency.create({
            name: agencyName,
            status: 'Active',
            subscriptionPlan: 'Premium',
            contactInfo: {
                phone: "+92 300 1234567",
                email: "info@bannupilot.com",
                address: "Bannu, Pakistan"
            }
        });
        console.log("Created Agency:", agencyName);
    } else {
        console.log("Agency exists:", agencyName);
    }

    // 2. Create Super Admin / Owner
    const adminEmail = "admin@bannupilot.com";
    const password = "admin"; // Change in prod

    let user = await User.findOne({ email: adminEmail });
    if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
            agencyId: agency._id,
            email: adminEmail,
            passwordHash,
            role: 'AgencyOwner',
            name: "Super Admin",
            permissions: ['ALL']
        });
        console.log(`Created User: ${adminEmail} / ${password}`);
    } else {
        console.log("User exists:", adminEmail);
    }

    await mongoose.disconnect();
    console.log("Done");
}

seed();
