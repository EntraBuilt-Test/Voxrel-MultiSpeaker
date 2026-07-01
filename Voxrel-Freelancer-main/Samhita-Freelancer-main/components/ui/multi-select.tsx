"use client"

import { Check, ChevronDown, X } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MultiSelectProps {
  options: Option[]
  onValueChange: (value: string[]) => void
  defaultValue?: string[]
  value?: string[]
  placeholder?: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  animation?: number
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
}

export function MultiSelect({
  options,
  onValueChange,
  defaultValue = [],
  value,
  placeholder = "Select options",
  variant = "default",
  animation = 0,
  maxCount = 3,
  modalPopover = false,
  asChild = false,
  className,
  ...props
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value || defaultValue)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // Sync internal state with external value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value)
    }
  }, [value])

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setIsPopoverOpen(true)
    } else if (event.key === "Backspace" && !(event.currentTarget as HTMLInputElement).value) {
      const newSelectedValues = [...selectedValues]
      newSelectedValues.pop()
      setSelectedValues(newSelectedValues)
      onValueChange(newSelectedValues)
    }
  }

  const toggleOption = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option]
    setSelectedValues(newSelectedValues)
    onValueChange(newSelectedValues)
  }

  const handleClear = () => {
    setSelectedValues([])
    onValueChange([])
  }

  const handleTogglePopover = () => {
    setIsPopoverOpen((prev) => !prev)
  }

  const clearExtraOptions = () => {
    const newSelectedValues = selectedValues.slice(0, maxCount)
    setSelectedValues(newSelectedValues)
    onValueChange(newSelectedValues)
  }

  const toggleAll = () => {
    if (selectedValues.length === options.length) {
      handleClear()
    } else {
      const allValues = options.map((option) => option.value)
      setSelectedValues(allValues)
      onValueChange(allValues)
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
      <PopoverTrigger asChild>
        <Button
          ref={asChild ? undefined : null}
          {...props}
          onClick={handleTogglePopover}
          className={cn(
            "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit",
            className
          )}
          variant="outline"
        >
          {selectedValues.length > 0 ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-wrap items-center">
                {selectedValues.slice(0, maxCount).map((value) => {
                  const option = options.find((o) => o.value === value)
                  const IconComponent = option?.icon
                  return (
                    <Badge
                      key={value}
                      className={cn(
                        "m-1 text-xs font-normal",
                        variant === "default" &&
                          "border-foreground/10 bg-card text-foreground hover:bg-card/80",
                        variant === "secondary" &&
                          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        variant === "destructive" &&
                          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                        variant === "outline" && "text-foreground"
                      )}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {IconComponent && (
                        <IconComponent className="h-4 w-4 mr-2" />
                      )}
                      {option?.label}
                      <X
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleOption(value)
                        }}
                      />
                    </Badge>
                  )
                })}
                {selectedValues.length > maxCount && (
                  <Badge
                    className={cn(
                      "m-1 text-xs font-normal border-foreground/10 bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    style={{ animationDuration: `${animation}s` }}
                  >
                    {`+ ${selectedValues.length - maxCount} more`}
                    <X
                      className="ml-2 h-4 w-4 cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation()
                        clearExtraOptions()
                      }}
                    />
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <X
                  className="h-4 mx-2 cursor-pointer text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleClear()
                  }}
                />
                <ChevronDown className="h-4 w-4 cursor-pointer text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mx-3">
              <span className="text-sm text-muted-foreground mx-3">{placeholder}</span>
              <ChevronDown className="h-4 w-4 cursor-pointer text-muted-foreground" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onEscapeKeyDown={() => setIsPopoverOpen(false)}
      >
        <Command>
          <CommandInput
            placeholder="Search..."
            onKeyDown={handleInputKeyDown}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedValues.length === options.length
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <span>(Select All)</span>
              </CommandItem>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
