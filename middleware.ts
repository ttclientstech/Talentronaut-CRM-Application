import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Role-based redirection
        if (
            req.nextUrl.pathname.startsWith("/admin") &&
            req.nextauth.token?.role !== "Admin"
        ) {
            return NextResponse.rewrite(new URL("/login", req.url));
        }

        if (
            req.nextUrl.pathname.startsWith("/sales") &&
            req.nextauth.token?.role !== "Sales Person" &&
            req.nextauth.token?.role !== "Admin" // Admin might want to see sales view? or strictly separate. PRD says Admin has full visibility.
        ) {
            // If Admin tries to go to /sales, maybe allow? PRD: "Admin ... View Analytics... Re-assign leads".
            // But typically Admin has their own dashboard.
            // Let's allow Admin for now or just restrict to strictly assigned roles if "Admin Dashboard" is inclusive.
            // For now, strict check for Sales Person on /sales to avoid confusion, unless Admin *visits* a sales page.
            if (req.nextauth.token?.role !== "Admin") {
                return NextResponse.rewrite(new URL("/login", req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = { matcher: ["/admin/:path*", "/sales/:path*", "/"] };
