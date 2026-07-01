"use client";

import { forwardRef } from "react";

import { Input } from "@/components/ui/input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        type="password"
        className={className}
        ref={ref}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

