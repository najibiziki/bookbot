import { useState, useCallback } from "react";

export const useServicesManager = (initialData = []) => {
  const [services, setServices] = useState(initialData);

  const updateService = useCallback((index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  const addService = useCallback(() => {
    setServices((prev) => [...prev, { name: "", duration: "", price: "" }]);
  }, []);

  const removeService = useCallback((index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    services,
    setServices,
    serviceHandlers: {
      updateService,
      addService,
      removeService,
    },
  };
};
