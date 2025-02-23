import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

//  Fetch transactions OR exchange rates
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const baseCurrency = searchParams.get("baseCurrency");
    
    // fetch exchange rates instead of transactions
    if (baseCurrency) {
      const exchangeRates = await getExchangeRates(baseCurrency);
      return new Response(JSON.stringify(exchangeRates), { status: 200 });
    }

    // fetch transactions
    const category = searchParams.get("category");
    const currency = searchParams.get("currency");
    const convertTo = searchParams.get("convertTo");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let filters = { userId: parseInt(session.user.id) };
    if (category) filters.category = category;
    if (currency) filters.currency = currency;
    if (startDate && endDate) {
      filters.createDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    let transactions = await prisma.transaction.findMany({
      where: filters,
      orderBy: { createDate: "desc" },
    });

    //  Convert currency if `convertTo` is requested
    if (convertTo) {
      const exchangeRates = await getExchangeRates();
      transactions = transactions.map((transaction) => {
        if (!exchangeRates[transaction.currency] || !exchangeRates[convertTo]) {
          return {
            ...transaction,
            convertedAmount: transaction.amount,
            convertedCurrency: transaction.currency,
          };
        }
        const convertedAmount = convertTransactionAmount(
          transaction.amount,
          transaction.currency,
          convertTo,
          exchangeRates
        );
        return { ...transaction, convertedAmount, convertedCurrency: convertTo };
      });
    }

    return new Response(JSON.stringify(transactions), { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

// Fetch exchange rates from an external API
async function getExchangeRates(baseCurrency = "USD") {
  const API_KEY = "048dfd0d1c6f05ce77283611"; // Replace with your actual API key
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.conversion_rates) throw new Error("Failed to fetch exchange rates");

    return data.conversion_rates;
  } catch (error) {
    console.error("Exchange Rate API Error:", error);
    return {};
  }
}

// POST method: Create a new transaction
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { amount, currency, category, description } = body;

    if (!amount || !currency || !category) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        currency,
        category,
        description,
        userId: parseInt(session.user.id),
      },
    });

    return new Response(JSON.stringify(transaction), { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

// Convert transaction amounts based on exchange rates
function convertTransactionAmount(amount, from, to, rates) {
  if (from === to) return amount;
  if (!rates[from] || !rates[to]) {
    console.warn(`Skipping conversion: Invalid rates for ${from} → ${to}`);
    return amount;
  }
  return amount * (rates[to] / rates[from]);
}
