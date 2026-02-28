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

        const allowedSalesRoles = ["Sales Person", "Lead", "Member", "Admin"];
        if (
            req.nextUrl.pathname.startsWith("/sales") &&
            !allowedSalesRoles.includes(req.nextauth.token?.role as string)
        ) {
            return NextResponse.rewrite(new URL("/login", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = { matcher: ["/admin/:path*", "/sales/:path*", "/"] };
