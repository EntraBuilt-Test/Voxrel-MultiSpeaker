"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReviewDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to "My Tasks" (Drafts) as the review dashboard is not used
    router.replace("/tasks/draft");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to My Tasks...</p>
      </div>
    </div>
  );
}

