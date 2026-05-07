
import { CurrencyConvert } from "../models/currencyConvert.js";
import{convertCurrency} from "../Utils/currency.js";

export const getUserCurrency = async (req, res) => {
  try {
    const { userId, toCurrency, amount } = req.body;

    if (!userId) {
      return res.status(400).json({ succ: false, message: "User ID is required" });
    }

    const targetCurrency = toCurrency ? toCurrency.toUpperCase() : "INR";
    const amountToConvert = amount ? parseFloat(amount) : 1;

    let userCurrency = await CurrencyConvert.findOne({ userId });

    if (!userCurrency) {
      userCurrency = new CurrencyConvert({
        userId,
        fromCurrency: "USD",
        toCurrency: targetCurrency,
        amount: amountToConvert,
      });
      await userCurrency.save();
    } else {
      
      if (userCurrency.toCurrency !== targetCurrency || userCurrency.amount !== amountToConvert) {
        userCurrency.toCurrency = targetCurrency;
        userCurrency.amount = amountToConvert;
        await userCurrency.save();
      }
    }

    const converted = await convertCurrency(
      userCurrency.fromCurrency,
      userCurrency.toCurrency,
      userCurrency.amount
    );

    return res.status(200).json({
      succ: true,
      message: "Currency conversion successful",
      data: converted,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};