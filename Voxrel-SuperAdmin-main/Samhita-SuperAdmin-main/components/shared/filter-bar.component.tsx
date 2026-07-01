"use client";

import { Search, Filter, RotateCcw, ArrowUpDown, Calendar as CalendarIcon } from 'lucide-react';
import React from 'react';


import { Button } from '@/components/ui/button.ui';
import { Calendar } from '@/components/ui/calendar.ui';
import { Card, CardContent } from '@/components/ui/card.ui';
import { Input } from '@/components/ui/input.ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.ui';
import { cn } from '@/lib/utils.lib';

export type FilterType = 'select' | 'date' | 'dateRange';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    key: string;
    type: FilterType;
    label?: string;
    placeholder?: string;
    options?: FilterOption[];
    className?: string;
    showWhen?: string; // Only show when another filter has this value
}

interface FilterBarProps {
    // Search functionality
    searchQuery?: string;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    showSearch?: boolean;

    // Filter functionality
    filters: FilterConfig[];
    filterValues: Record<string, string | undefined>;
    onFilterChange: (key: string, value: string | undefined) => void;

    // Sort functionality - combined control
    sortOptions?: FilterOption[];
    sortValue?: string;
    onSortChange?: (value: string) => void;
    sortPlaceholder?: string;
    showSort?: boolean;

    // Reset functionality
    onReset: () => void;
    resetLabel?: string;

    // Styling
    className?: string;
    contentClassName?: string;

    // Layout - always responsive
    layout?: 'wrap' | 'row';
    _layout?: 'wrap' | 'row';
}

const formatDateLocal = (date: Date | undefined) => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function FilterBar({
    searchQuery = '',
    onSearch,
    searchPlaceholder = 'Search...',
    showSearch = true,
    filters,
    filterValues,
    onFilterChange,
    sortOptions,
    sortValue,
    onSortChange,
    sortPlaceholder = 'Sort by...',
    showSort = true,
    onReset,
    resetLabel = 'Reset',
    className,
    contentClassName,
    _layout = 'wrap',
}: FilterBarProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch?.(e.target.value);
    };

    const renderFilter = (filter: FilterConfig) => {
        // Check if filter should be shown based on showWhen condition
        if (filter.showWhen) {
            const dependentValue = filterValues.quickFilter; // Assuming quickFilter is the dependent field
            if (dependentValue !== filter.showWhen) {
                return null; // Don't render this filter
            }
        }

        const value = filterValues[filter.key];

        switch (filter.type) {
            case 'select':
                return (
                    <Select
                        key={filter.key}
                        value={value || ''}
                        onValueChange={(newValue) => onFilterChange(filter.key, newValue)}
                    >
                        <SelectTrigger className={cn('h-8 min-w-[100px] max-w-[150px] w-fit', filter.className)}>
                            <Filter className="h-4 w-4 mr-1 flex-shrink-0" />
                            <SelectValue placeholder={filter.placeholder || filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                            {filter.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'date':
                return (
                    <Popover key={filter.key}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'h-8 min-w-[120px] max-w-[150px] justify-start text-left font-normal',
                                    !value && 'text-muted-foreground',
                                    filter.className
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? new Date(value).toLocaleDateString() : filter.placeholder || filter.label}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={value ? new Date(value) : undefined}
                                onSelect={(date) => onFilterChange(filter.key, formatDateLocal(date))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                );

            case 'dateRange':
                const fromKey = `${filter.key}From`;
                const toKey = `${filter.key}To`;
                const fromValue = filterValues[fromKey];
                const toValue = filterValues[toKey];

                // Create date range object for Calendar component
                const dateRange = {
                    from: fromValue ? new Date(fromValue) : undefined,
                    to: toValue ? new Date(toValue) : undefined,
                };

                const formatDateRange = () => {
                    if (fromValue && toValue) {
                        return `${new Date(fromValue).toLocaleDateString()} - ${new Date(toValue).toLocaleDateString()}`;
                    } else if (fromValue) {
                        return `${new Date(fromValue).toLocaleDateString()} - ...`;
                    } else if (toValue) {
                        return `... - ${new Date(toValue).toLocaleDateString()}`;
                    }
                    return filter.placeholder || 'Select date range';
                };

                return (
                    <Popover key={filter.key}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'h-8 min-w-[160px] max-w-[220px] justify-start text-left font-normal',
                                    !fromValue && !toValue && 'text-muted-foreground',
                                    filter.className
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{formatDateRange()}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    onFilterChange(fromKey, formatDateLocal(range?.from));
                                    onFilterChange(toKey, formatDateLocal(range?.to));
                                }}
                                numberOfMonths={1}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn('shrink-0', className)}>
            <Card>
                <CardContent className={cn('px-3 py-2', contentClassName)}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Left side - Filters and Sort */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search Section */}
                            {showSearch && onSearch && (
                                <div className="relative min-w-0 flex-1 min-w-[200px] max-w-[300px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                                    <Input
                                        placeholder={searchPlaceholder}
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="h-8 pl-10 text-sm"
                                    />
                                </div>
                            )}

                            {/* Filters Section */}
                            {filters.map(renderFilter).filter(Boolean)}

                            {/* Sort Section */}
                            {showSort && sortOptions && onSortChange && (
                                <Select
                                    value={sortValue || ''}
                                    onValueChange={onSortChange}
                                >
                                    <SelectTrigger className="h-8 min-w-[140px] max-w-[180px] w-fit">
                                        <ArrowUpDown className="h-4 w-4 mr-1 flex-shrink-0" />
                                        <SelectValue placeholder={sortPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Right side - Reset Button with Label */}
                        <Button
                            variant="outline"
                            onClick={onReset}
                            className="h-8 px-3 flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            {resetLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default FilterBar;
