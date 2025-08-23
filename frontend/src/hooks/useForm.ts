import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: string) => string | null;
}

interface FormField {
  value: string;
  error: string;
  touched: boolean;
  rules?: ValidationRules;
}

interface UseFormOptions<T extends Record<string, string>> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRules>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, string>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) {
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initial = {} as Record<keyof T, FormField>;
    Object.keys(initialValues).forEach((key) => {
      const k = key as keyof T;
      initial[k] = {
        value: initialValues[k],
        error: '',
        touched: false,
        rules: validationRules[k],
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: keyof T, value: string): string => {
    const rules = validationRules[name];
    if (!rules) return '';

    // 必填验证
    if (rules.required && !value.trim()) {
      return '此字段为必填项';
    }

    // 长度验证
    if (rules.minLength && value.length < rules.minLength) {
      return `最少需要${rules.minLength}个字符`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `最多允许${rules.maxLength}个字符`;
    }

    // 邮箱验证
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '请输入有效的邮箱地址';
    }

    // 正则验证
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return '格式不正确';
    }

    // 自定义验证
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return '';
  }, [validationRules]);

  const setValue = useCallback((name: keyof T, value: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: validateField(name, value),
        touched: true,
      },
    }));
  }, [validateField]);

  const setError = useCallback((name: keyof T, error: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error,
      },
    }));
  }, []);

  const validateAll = useCallback((): boolean => {
    let isValid = true;
    const newFields = { ...fields };

    Object.keys(fields).forEach((key) => {
      const k = key as keyof T;
      const field = fields[k];
      const error = validateField(k, field.value);
      
      newFields[k] = {
        ...field,
        error,
        touched: true,
      };

      if (error) {
        isValid = false;
      }
    });

    setFields(newFields);
    return isValid;
  }, [fields, validateField]);

  const getValues = useCallback((): T => {
    const values = {} as T;
    Object.keys(fields).forEach((key) => {
      const k = key as keyof T;
      values[k] = fields[k].value as T[keyof T];
    });
    return values;
  }, [fields]);

  const reset = useCallback(() => {
    const resetFields = {} as Record<keyof T, FormField>;
    Object.keys(initialValues).forEach((key) => {
      const k = key as keyof T;
      resetFields[k] = {
        value: initialValues[k],
        error: '',
        touched: false,
        rules: validationRules[k],
      };
    });
    setFields(resetFields);
  }, [initialValues, validationRules]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(getValues());
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateAll, onSubmit, getValues]);

  return {
    fields,
    setValue,
    setError,
    getValues,
    reset,
    handleSubmit,
    isSubmitting,
    isValid: Object.values(fields).every(field => !field.error),
  };
}