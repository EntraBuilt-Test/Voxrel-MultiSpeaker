"use client";

// SUPER ADMIN EXTENSION: Manage Projects Page - Redirects to landing page
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RoleGuard } from "@/components/auth/role.guard";

export default function SuperAdminManageProjectsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main Super Admin landing page which now shows the table
    router.replace('/super-admin');
  }, [router]);

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Redirecting...</div>
      </div>
    </RoleGuard>
  );
}

