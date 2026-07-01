"use client"

import { CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button.ui"
import { Calendar } from "@/components/ui/calendar.ui"
import { cn } from "@/lib/utils.lib"

interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    disabled?: boolean
    placeholder?: string
    className?: string
    minDate?: Date
    maxDate?: Date
    openUpward?: boolean
}

export function DatePicker({
    value,
    onChange,
    disabled = false,
    placeholder = "Pick a date",
    className,
    minDate,
    maxDate,
    openUpward = false
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Close when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <Button
                variant="outline"
                className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !value && "text-muted-foreground"
                )}
                onClick={() => setOpen(!open)}
                disabled={disabled}
            >
                <CalendarIcon className="mr-1 h-4 w-4" />
                {value ? formatDate(value) : placeholder}
            </Button>
            {open && (
                <div className={cn(
                    "absolute left-0 z-50 p-3 bg-background border rounded-md shadow-md",
                    openUpward
                        ? "bottom-full mb-1"
                        : "top-full mt-1"
                )}>
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                            onChange?.(date)
                            setOpen(false)
                        }}
                        disabled={disabled ? true : (date: Date) => {
                            if (minDate && date < minDate) return true
                            if (maxDate && date > maxDate) return true
                            return false
                        }}
                    />
                </div>
            )}
        </div>
    )
}
