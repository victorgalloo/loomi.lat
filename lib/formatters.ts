const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1
});

export const formatNumber = (value: number, options?: { percent?: boolean }) => {
  if (options?.percent) {
    return percentFormatter.format(value);
  }
  return currencyFormatter.format(value);
};

