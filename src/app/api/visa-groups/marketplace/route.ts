import connectToDatabase from "@/lib/db";
import VisaGroup from "@/models/VisaGroup";
import AgentProfile from "@/models/AgentProfile";
import "@/models/Agency";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const type = searchParams.get("type");

    let query: any = {
        status: 'active',
        available_visas: { $gt: 0 },
        // Business Rule: Hide expired visas
        $or: [
            { expires_at: { $exists: false } },
            { expires_at: { $gt: new Date() } }
        ]
    };

    if (country) {
        query.country = { $regex: country, $options: 'i' };
    }
    if (type) {
        query.visa_type = type;
    }

    try {
        const visas = await VisaGroup.find(query)
            .populate('agency_id', 'name contactInfo') // Populate minimal agency info
            .sort({ created_at: -1 })
            .limit(50)
            .lean(); // Fetch as plain objects to allow modification

        // Fetch Agent Profiles & Admins for Mobile Numbers (Side-loading)
        const agencyIds = [...new Set(visas.map((v: any) => v.agency_id?._id?.toString()).filter(Boolean))];

        const [profiles, admins] = await Promise.all([
            AgentProfile.find({ agencyId: { $in: agencyIds } }).lean(),
            import("@/models/User").then(mod => mod.default.find({
                agencyId: { $in: agencyIds },
                // Handle potential role variances (AgencyOwner vs AgencyAdmin)
                role: { $in: ['AgencyOwner', 'AgencyAdmin', 'SuperAdmin'] }
            }).lean())
        ]);

        // Map Agency ID -> Mobile Number
        const phoneMap: Record<string, string> = {};

        agencyIds.forEach((id: any) => {
            const agencyIdStr = id.toString();
            const agencyProfiles = profiles.filter((p: any) => p.agencyId.toString() === agencyIdStr);
            const agencyAdmin = admins.find((u: any) => u.agencyId.toString() === agencyIdStr);

            if (agencyProfiles.length > 0) {
                let bestProfile = agencyProfiles[0]; // Default to first

                if (agencyAdmin) {
                    // Try to find a profile matching the admin name
                    const match = agencyProfiles.find((p: any) =>
                        (p.name && p.name.toLowerCase() === agencyAdmin.name.toLowerCase()) ||
                        (p.source_name && p.source_name.toLowerCase() === agencyAdmin.name.toLowerCase())
                    );
                    if (match) bestProfile = match;
                }

                phoneMap[agencyIdStr] = bestProfile.mobile_number;
            }
        });

        // Attach mobile numbers to results
        visas.forEach((v: any) => {
            if (v.agency_id) {
                const agencyId = v.agency_id._id.toString();
                if (phoneMap[agencyId]) {
                    // Ensure structure exists
                    if (!v.agency_id.contactInfo) v.agency_id.contactInfo = {};

                    // Override/Set phone from profile
                    v.agency_id.contactInfo.phone = phoneMap[agencyId];
                }
            }
        });

        // Debug output removed to keep logs clean, or can be kept if needed
        // console.log("Servicing Marketplace Request with Side-loaded profiles");

        return NextResponse.json(visas);
    } catch (error) {
        console.error("Marketplace API Error:", error);
        return NextResponse.json({ error: "Failed to fetch marketplace" }, { status: 500 });
    }
}
