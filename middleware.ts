import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is trying to access the admin panel
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const role = req.nextauth.token?.role;
      // Only allow TEACHER or ADMIN roles
      if (role !== "TEACHER" && role !== "ADMIN") {
        // Kick them back to the dashboard
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Must be logged in
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/exam", "/practice/:path*", "/admin"],
};