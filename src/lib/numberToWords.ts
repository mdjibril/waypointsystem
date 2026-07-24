const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    const tensWord = TENS[Math.floor(n / 10)];
    const onesWord = ONES[n % 10];
    parts.push(onesWord ? `${tensWord}-${onesWord}` : tensWord);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

export function numberToWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";

  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const groupWords = threeDigitsToWords(groups[i]);
    words.push(SCALES[i] ? `${groupWords} ${SCALES[i]}` : groupWords);
  }

  return words.join(" ");
}

const CURRENCY_UNITS: Record<string, { major: string; minor: string }> = {
  NGN: { major: "Naira", minor: "Kobo" },
  USD: { major: "Dollars", minor: "Cents" },
  GBP: { major: "Pounds", minor: "Pence" },
};

export function amountToWords(amount: number, currency: string): string {
  const unit = CURRENCY_UNITS[currency];
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);

  let words = `${numberToWords(whole)} ${unit ? unit.major : currency}`;
  if (fraction > 0 && unit) {
    words += ` and ${numberToWords(fraction)} ${unit.minor}`;
  }
  return `${words} Only`;
}
