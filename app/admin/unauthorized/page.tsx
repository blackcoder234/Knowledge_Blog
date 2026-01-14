"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/ui/Container";
import { Suspense } from "react";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("from") || "/admin/dashboard";

  return (
    <Container className="flex min-h-[80vh] items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6 p-8 border border-red-500/20 bg-red-500/5 rounded-2xl backdrop-blur-sm">
            <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                 </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-white">Access Denied</h1>
            <p className="text-zinc-400">
                You do not have permission to view this page. This area is restricted to administrators only.
            </p>

            <div className="pt-4 flex flex-col gap-3">
                <Link href={`/login?callbackUrl=${returnUrl}`}>
                    <Button variant="primary" className="w-full bg-red-600 hover:bg-red-700 text-white border-none">
                        Login with Admin Credentials
                    </Button>
                </Link>
                <Link href="/">
                     <Button variant="ghost" className="w-full">
                        Return to Homepage
                    </Button>
                </Link>
            </div>
        </div>
    </Container>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div className="text-center p-20 text-white">Loading...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}
