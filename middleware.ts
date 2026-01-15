import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const isUnauthorizedPage = req.nextUrl.pathname.startsWith('/admin/unauthorized');

    if (isAuthPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        return null;
    }

    if (isAdminPage && !isUnauthorizedPage) {
        // [MODIFICATION] Strict check: Don't redirect if we are already on the admin login page!
        const isAdminLoginPage = req.nextUrl.pathname === '/admin/login';

        if (isAdminLoginPage) {
             // If we are already on the login page, just let it load.
             // (Optionally, if they are already logged in, we could redirect to dashboard here, but let's keep it simple)
             return null;
        }

        if (!isAuth) {
            // If trying to access admin page while not logged in, redirect to login with callback
            const from = req.nextUrl.pathname;
            // Redirect to ADMIN login, not user login
            return NextResponse.redirect(new URL(`/admin/login?callbackUrl=${from}`, req.url));
        }
        
        const role = token?.role as string;
        const allowedRoles = ['admin', 'super_admin', 'editor'];

        // 1. Check if user has ANY admin-level role
        if (!allowedRoles.includes(role)) {
             // Logged in but not staff -> Redirect to unauthorized page
            return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
        }

        // 2. Strict Role Checks for Specific Pages
        const isSuperAdminOrAdmin = ['admin', 'super_admin'].includes(role);

        // Editors cannot access Users, Analytics, or Settings
        if (
            (req.nextUrl.pathname.startsWith('/admin/users') || 
             req.nextUrl.pathname.startsWith('/admin/analytics') ||
             req.nextUrl.pathname.startsWith('/admin/settings')) && 
            !isSuperAdminOrAdmin
        ) {
            return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
        }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
          // Verify access
          if (req.nextUrl.pathname.startsWith('/admin/unauthorized')) {
               return true; // Allow everyone to see the unauthorized page
          }
          if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
              return true;
          }
          if (req.nextUrl.pathname.startsWith('/admin')) {
              // We return true here to let the middleware function handle the specific redirects
              // otherwise next-auth's default behavior kicks in which is just a login redirect
              return true; 
          }
          return !!token;
      },
    },
    pages: {
        signIn: '/login',
    }
  }
);

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup"],
};
