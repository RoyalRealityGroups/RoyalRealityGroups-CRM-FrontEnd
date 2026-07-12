export const formatNumber = (value: number | string): number => {
  const num = parseFloat(value.toString());
  return num % 1 === 0 ? parseInt(num.toString()) : num;
};