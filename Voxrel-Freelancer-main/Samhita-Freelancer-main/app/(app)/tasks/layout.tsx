"use client";

import { usePathname } from "next/navigation";

import {
  DEFAULT_TASK_CONFIG,
  TASK_PAGE_CONFIG,
} from "@/constants/tasks";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getTitle = () => {
    const config = TASK_PAGE_CONFIG[pathname as keyof typeof TASK_PAGE_CONFIG];
    return config?.title || DEFAULT_TASK_CONFIG.title;
  };

  const getDescription = () => {
    const config = TASK_PAGE_CONFIG[pathname as keyof typeof TASK_PAGE_CONFIG];
    return config?.description || DEFAULT_TASK_CONFIG.description;
  };

  return (
    <div className="min-vh-screen flex w-full flex-col gap-4 px-4">
      <div className="flex w-full flex-col gap-1">
        <span className="text-2xl font-bold">{getTitle()}</span>
        <span className="text-muted-foreground text-sm">
          {getDescription()}
        </span>
      </div>
      <div className="flex w-full flex-col">{children}</div>
    </div>
  );
}
