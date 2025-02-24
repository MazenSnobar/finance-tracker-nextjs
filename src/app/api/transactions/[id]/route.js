import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route.js";

const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    
    const url = new URL(req.url);
    const transactionId = url.pathname.split("/").pop(); 

    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Transaction ID is required" }), { status: 400 });
    }

    const body = await req.json();
    const { amount, currency, category, description } = body;

    if (!amount || !currency || !category) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    //  Update transaction in database
    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(transactionId, 10), userId: session.user.id },
      data: { 
        amount: parseFloat(amount),
        currency,
        category,
        description 
      },
    });

    return new Response(JSON.stringify(updatedTransaction), { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
export async function DELETE(req, { params }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
  
      const transactionId = parseInt(params.id, 10);
    if (isNaN(transactionId)) {
      return new Response(JSON.stringify({ error: "Invalid transaction ID" }), { status: 400 });
    }
  
      if (!transactionId) {
        return new Response(JSON.stringify({ error: "Transaction ID is required" }), { status: 400 });
      }
  
      await prisma.transaction.delete({
        where: { id: parseInt(transactionId, 10), userId: session.user.id },
      });
  
      return new Response(JSON.stringify({ message: "Transaction deleted successfully" }), { status: 200 });
    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
  }
  
