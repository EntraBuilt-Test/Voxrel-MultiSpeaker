'use client';

import { Search, Filter, RotateCcw, ArrowUpDown, Calendar as CalendarIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  showWhen?: string;
}

interface FilterBarProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  filters: FilterConfig[];
  filterValues: Record<string, string | undefined>;
  onFilterChange: (key: string, value: string | undefined) => void;
  sortOptions?: FilterOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortPlaceholder?: string;
  showSort?: boolean;
  onReset: () => void;
  resetLabel?: string;
  className?: string;
  contentClassName?: string;
}

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
}: FilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  const renderFilter = (filter: FilterConfig): React.ReactNode => {
    if (filter.showWhen) {
      const dependentValue = filterValues.quickFilter;
      if (dependentValue !== filter.showWhen) {
        return null;
      }
    }

    const value = filterValues[filter.key];

    switch (filter.type) {
      case 'select':
        return (
          <Select
            key={filter.key}
            value={value ?? ''}
            onValueChange={(newValue) => onFilterChange(filter.key, newValue || undefined)}
          >
            <SelectTrigger className={cn('h-8 min-w-[140px] w-fit max-w-[180px]', filter.className)}>
              <Filter className="h-4 w-4 mr-1 shrink-0" />
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
                  'h-8 min-w-[150px] justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  filter.className
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {value ? new Date(value).toLocaleDateString() : filter.placeholder || filter.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onFilterChange(filter.key, date?.toISOString().split('T')[0])}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'dateRange': {
        const fromKey = `${filter.key}From`;
        const toKey = `${filter.key}To`;
        const fromValue = filterValues[fromKey];
        const toValue = filterValues[toKey];

        const dateRange = {
          from: fromValue ? new Date(fromValue) : undefined,
          to: toValue ? new Date(toValue) : undefined,
        };

        const formatDateRange = () => {
          if (fromValue && toValue) {
            return `${new Date(fromValue).toLocaleDateString()} - ${new Date(toValue).toLocaleDateString()}`;
          }
          if (fromValue) {
            return `${new Date(fromValue).toLocaleDateString()} - ...`;
          }
          if (toValue) {
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
                  'h-8 min-w-[200px] justify-start text-left font-normal',
                  !fromValue && !toValue && 'text-muted-foreground',
                  filter.className
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{formatDateRange()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  const fromDate = range?.from?.toISOString().split('T')[0];
                  const toDate = range?.to?.toISOString().split('T')[0];
                  onFilterChange(fromKey, fromDate);
                  onFilterChange(toKey, toDate);
                }}
                numberOfMonths={1}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
      default:
        return null;
    }
  };

  const renderedFilters = filters
    .map(renderFilter)
    .filter((component): component is React.ReactNode => Boolean(component));

  return (
    <div className={cn('shrink-0', className)}>
      <Card>
        <CardContent className={cn('px-3 py-2', contentClassName)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {showSearch && onSearch && (
                <div className="relative min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="h-8 pl-10 text-sm"
                  />
                </div>
              )}

              {renderedFilters}

              {showSort && sortOptions && onSortChange && (
                <Select value={sortValue ?? ''} onValueChange={(value) => onSortChange(value)}>
                  <SelectTrigger className="h-8 min-w-[140px] w-fit max-w-[200px]">
                    <ArrowUpDown className="h-4 w-4 mr-1 shrink-0" />
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

            <Button variant="outline" onClick={onReset} className="h-8 px-4 flex items-center gap-2">
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

