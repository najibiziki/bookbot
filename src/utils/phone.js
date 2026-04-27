export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  const cleaned = phone.replace(/[+\s\-()]/g, "");

  if (cleaned.startsWith("06")) {
    return `+212 ${cleaned.slice(1, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }

  if (cleaned.startsWith("6") && cleaned.length === 9) {
    return `+212 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  }

  if (cleaned.startsWith("2126") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }

  return phone.startsWith("+") ? phone : `+${phone}`;
};

export const getCleanPhone = (phone) => {
  if (!phone) return "";

  const cleaned = phone.replace(/[+\s\-()]/g, "");

  if (cleaned.startsWith("06")) return `212${cleaned.slice(1)}`;
  if (cleaned.startsWith("6") && cleaned.length === 9) return `212${cleaned}`;
  if (cleaned.startsWith("212")) return cleaned;

  return cleaned;
};
