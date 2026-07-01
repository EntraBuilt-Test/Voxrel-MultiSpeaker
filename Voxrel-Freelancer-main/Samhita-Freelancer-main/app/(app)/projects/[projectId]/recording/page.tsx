"use client";

import { Mic, Users, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores";

export default function RecordingDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { selectedProject, getProjectById } = useProjectStore();
  const [recordingMode, setRecordingMode] = useState<"single" | "multi" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verify project is selected
    if (!selectedProject || selectedProject.id !== projectId) {
      const project = getProjectById(projectId);
      if (!project) {
        toast.error("Project not found");
        router.push("/projects");
        return;
      }
    }
    setIsLoading(false);
  }, [projectId, selectedProject, getProjectById, router]);

  const handleModeSelection = (mode: "single" | "multi") => {
    setRecordingMode(mode);
    if (mode === "single") {
      router.push(`/projects/${projectId}/recording/single`);
    } else {
      router.push(`/projects/${projectId}/recording/multi`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] w-full relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden bg-dot-pattern">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow delay-1000" />

      <div className="w-full max-w-5xl z-10 space-y-12">
        {/* Navigation & Header Section */}
        <div className="relative text-center space-y-6">
          <div className="absolute left-0 top-2 hidden md:block">
            <Button
              variant="ghost"
              onClick={() => router.push("/projects/manage")}
              className="text-muted-foreground hover:text-foreground group text-sm font-medium transition-colors"
            >
              <div className="p-1 rounded-full bg-muted group-hover:bg-primary/10 mr-2 transition-colors">
                <ArrowLeft className="h-3 w-3 group-hover:text-primary transition-colors" />
              </div>
              Back to Projects
            </Button>
          </div>

          <div className="space-y-4 pt-8 md:pt-0 animate-in fade-in slide-in-from-top-4 duration-700">


            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-500 drop-shadow-sm">
              STOTRA
            </h1>

            <div className="max-w-2xl mx-auto space-y-2">
              <h2 className="text-xl md:text-2xl font-medium text-foreground/80 tracking-tight">
                Recording Dashboard
              </h2>
              <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed">
                {selectedProject?.name || "Audio Recording Workspace"}
              </p>
            </div>
          </div>
        </div>

        {!recordingMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {/* Single Speaker Card */}
            <div
              className="group relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleModeSelection("single")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative h-full flex flex-col p-6 md:p-8 rounded-[1.25rem] bg-gradient-to-b from-white/50 to-white/0 dark:from-white/5 dark:to-transparent">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                    <Mic className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Single Speaker
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Personal recording space optimized for clarity and focus. Ideal for monologues and voiceovers.
                  </p>
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSelection("single");
                  }}
                >
                  Start Recording
                </Button>
              </div>
            </div>

            {/* Multi Speaker Card */}
            <div
              className="group relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleModeSelection("multi")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative h-full flex flex-col p-6 md:p-8 rounded-[1.25rem] bg-gradient-to-b from-white/50 to-white/0 dark:from-white/5 dark:to-transparent">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm">
                    <Users className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Multi Speaker
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Collaborative recording environment. Perfect for interviews, meetings, and group discussions.
                  </p>
                </div>

                <Button
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleModeSelection("multi");
                  }}
                >
                  Create Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

