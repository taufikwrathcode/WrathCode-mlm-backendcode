import axios from "axios";
// Top currencies
export const topCurrencies = [
  { code: "USD", symbol: "$" },
  { code: "INR", symbol: "₹" },
  { code: "EUR", symbol: "€" },
  { code: "JPY", symbol: "¥" },
  { code: "GBP", symbol: "£" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "CHF", symbol: "CHF" },
  { code: "CNY", symbol: "¥" },
  { code: "BRL", symbol: "R$" }
];


export const convertCurrency = async (from = "USD", to = "INR", amount = 1) => {
  try {
    from = from.toUpperCase();
    to = to.toUpperCase();


   if (from === to) {
      const currency = topCurrencies.find(c => c.code === to);
      return {
        code: to,
        symbol: currency?.symbol || "",
        amount
      };
    }
    const response = await axios.get(`https://open.er-api.com/v6/latest/${from}`);
const rates = response.data.rates || {};
const rate = rates[to];

if (!rate) {
  console.log("Rate not found");
  return amount;
}


    if (!rate) {
      console.warn(`Conversion rate not found for ${from} to ${to}, returning default amount`);
      const currency = topCurrencies.find(c => c.code === to) || { code: to, symbol: "" };
      return { code: currency.code, symbol: currency.symbol, amount };
    }

    const currency = topCurrencies.find(c => c.code === to) || { code: to, symbol: "" };
    return {
      code: currency.code,
      symbol: currency.symbol,
      amount: parseFloat((amount * rate).toFixed(2))
    };
  } catch (error) {
    console.error("Error converting currency:", error.message);
    const currency = topCurrencies.find(c => c.code === to) || { code: to, symbol: "" };
    return { code: currency.code, symbol: currency.symbol, amount };
  }
};
const converted = await convertCurrency("USD", "INR", 1);
console.log(converted);
