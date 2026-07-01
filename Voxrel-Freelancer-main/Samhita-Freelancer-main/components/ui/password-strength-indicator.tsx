"use client";

import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "One uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "One lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "One number", test: (pwd) => /[0-9]/.test(pwd) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  const fulfilledCount = requirements.filter((req) => req.test(password)).length;
  const strengthPercentage = (fulfilledCount / requirements.length) * 100;

  // Determine strength level
  let strengthLabel = "";
  let strengthColor = "";
  if (strengthPercentage === 100) {
    strengthLabel = "Strong";
    strengthColor = "bg-green-500";
  } else if (strengthPercentage >= 75) {
    strengthLabel = "Good";
    strengthColor = "bg-blue-500";
  } else if (strengthPercentage >= 50) {
    strengthLabel = "Fair";
    strengthColor = "bg-yellow-500";
  } else {
    strengthLabel = "Weak";
    strengthColor = "bg-red-500";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Password Strength</span>
          <span className={cn(
            "text-xs font-medium",
            strengthColor.replace("bg-", "text-")
          )}>
            {strengthLabel}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strengthColor)}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-1">
        {requirements.map((req, index) => {
          const isFulfilled = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isFulfilled ? (
                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
              <span className={cn(
                "transition-colors",
                isFulfilled ? "text-green-600" : "text-gray-500"
              )}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

