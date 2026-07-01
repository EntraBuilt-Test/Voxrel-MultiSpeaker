"use client";

// SUPER ADMIN EXTENSION: Role-based access guard
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserStore } from "@/stores";


interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('SUPER_ADMIN' | 'ADMIN' | 'FREELANCER')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { isSuperAdmin, isAdmin, isLoggedIn } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAccess = () => {
      if (!isLoggedIn()) {
        router.push('/login');
        return;
      }

      // Check user role from localStorage
      const user = localStorage.getItem('user');
      if (user && user !== 'null' && user !== 'undefined') {
        try {
          const parsedUser = JSON.parse(user);
          const userRole = parsedUser?.role;

          if (allowedRoles.includes(userRole)) {
            setHasAccess(true);
          } else {
            // Redirect to appropriate page based on role
            if (userRole === 'SUPER_ADMIN') {
              router.push('/super-admin');
            } else if (userRole === 'ADMIN') {
              router.push('/projects');
            } else {
              router.push('/task/manage');
            }
          }
        } catch {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setIsChecking(false);
    };

    // Small delay to ensure store is initialized
    setTimeout(checkAccess, 100);
  }, [router, allowedRoles, isLoggedIn, isSuperAdmin, isAdmin]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

