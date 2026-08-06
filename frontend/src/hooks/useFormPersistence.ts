import { useEffect, useRef } from 'react';

/**
 * Hook to persist form data to localStorage and prevent data loss
 * @param formKey - Unique key to identify the form
 * @param formData - Current form data
 * @param clearOnSubmit - Whether to clear persisted data on successful submit
 */
export function useFormPersistence<T>(
  formKey: string,
  formData: T
) {
  const isInitialMount = useRef(true);
  const storageKey = `form_persist_${formKey}`;

  useEffect(() => {
    if (isInitialMount.current) {
      try {
        const persisted = localStorage.getItem(storageKey);
        if (persisted) {
          const parsed = JSON.parse(persisted);
          return parsed;
        }
      } catch (error) {
        console.error('Failed to load persisted form data:', error);
      }
      isInitialMount.current = false;
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isInitialMount.current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.error('Failed to persist form data:', error);
      }
    }
  }, [formData, storageKey]);

  const clearPersistedData = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear persisted form data:', error);
    }
  };

  const loadPersistedData = (): T | null => {
    try {
      const persisted = localStorage.getItem(storageKey);
      if (persisted) {
        return JSON.parse(persisted);
      }
    } catch (error) {
      console.error('Failed to load persisted form data:', error);
    }
    return null;
  };

  return {
    clearPersistedData,
    loadPersistedData,
  };
}
