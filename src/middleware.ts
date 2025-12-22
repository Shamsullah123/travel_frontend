import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Example: Protect Admin routes
        // If we add /admin routes later, this logic handles it
        if (path.startsWith("/admin") && token?.role !== "SuperAdmin") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // AgencyAdmin only routes (e.g. detailed accounting or settings)
        // if (path.startsWith("/settings") && token?.role === "Agent") {
        //     return NextResponse.redirect(new URL("/", req.url));
        // }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - auth (authentication routes)
         * - api/auth (API authentication routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!auth|api|_next/static|_next/image|favicon.ico|about|contact|$).*)"
    ],
};
