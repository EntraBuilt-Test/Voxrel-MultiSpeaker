"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { VerifyOTPForm } from "@/components/blocks/verify-otp";

function VerifyOTPContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    
    return <VerifyOTPForm email={email || undefined} />;
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<VerifyOTPForm />}>
            <VerifyOTPContent />
        </Suspense>
    );
}
