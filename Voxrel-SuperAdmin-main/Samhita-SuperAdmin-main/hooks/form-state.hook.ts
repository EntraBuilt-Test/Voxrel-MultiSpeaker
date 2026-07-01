import { useState, useCallback, useMemo } from 'react';
import { VALIDATION_MESSAGES } from '@/constants/options.constants';

export type ValidationRule<T = any> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  matchField?: string; // For password confirmation - use string to avoid type conflicts
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormStateReturn<T> {
  values: T;
  errors: FormErrors<T>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: keyof T) => (value: string) => void;
  handleDateChange: (field: keyof T) => (date: Date | undefined) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  validateField: (field: keyof T) => void;
  validateAll: () => boolean;
  reset: (newValues?: T) => void;
  clearErrors: () => void;
}

/**
 * Hook for managing form state with validation
 * Provides consistent form handling across the application
 * 
 * @example
 * const form = useFormState(
 *   { name: '', email: '', password: '' },
 *   {
 *     name: { required: true, minLength: 2 },
 *     email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
 *     password: { required: true, minLength: 8 }
 *   }
 * );
 * 
 * // In component:
 * <Input
 *   value={form.values.name}
 *   onChange={form.handleChange('name')}
 *   error={form.errors.name}
 * />
 */
export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
): UseFormStateReturn<T> {
  const [values, setFormValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isDirty, setIsDirty] = useState(false);

  const validateField = useCallback((field: keyof T): string | null => {
    const value = values[field];
    const rules = validationRules[field];

    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return VALIDATION_MESSAGES.required;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return VALIDATION_MESSAGES.minLength(rules.minLength);
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return VALIDATION_MESSAGES.maxLength(rules.maxLength);
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        if (rules.pattern.source.includes('@')) {
          return VALIDATION_MESSAGES.email;
        }
        return 'Invalid format';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.minLength && value < rules.minLength) {
        return VALIDATION_MESSAGES.min(rules.minLength);
      }
    }

    // Match validation (for password confirmation)
    if (rules.matchField) {
      const matchValue = values[rules.matchField as keyof typeof values];
      if (value !== matchValue) {
        return VALIDATION_MESSAGES.match;
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [values, validationRules]);

  const validateFieldAndSetError = useCallback((field: keyof T) => {
    const error = validateField(field);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
    return !error;
  }, [validateField]);

  const handleChange = useCallback((field: keyof T) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
      setFormValues(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }, [errors]);

  const handleSelectChange = useCallback((field: keyof T) => (value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user selects
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleDateChange = useCallback((field: keyof T) => (date: Date | undefined) => {
    setFormValues(prev => ({ ...prev, [field]: date }));
    setIsDirty(true);
    
    // Clear error when user selects date
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setFormValues(prev => ({ ...prev, ...newValues }));
    setIsDirty(true);
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isFormValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field as keyof T] = error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [validateField, validationRules]);

  const reset = useCallback((newValues?: T) => {
    const valuesToReset = newValues || initialValues;
    setFormValues(valuesToReset);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return (e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (validateAll()) {
        onSubmit(values);
      }
    };
  }, [validateAll, values]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    isDirty,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleSubmit,
    setValue,
    setValues,
    validateField: validateFieldAndSetError,
    validateAll,
    reset,
    clearErrors,
  };
}

export default useFormState;
