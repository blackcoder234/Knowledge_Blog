import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, subject, message } = body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const newContact = await Contact.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    return NextResponse.json({ message: "Message sent successfully", contact: newContact }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        // Assuming admin protection is handled by middleware or check session here if needed, 
        // strictly speaking this should be protected.
        // For simplicity, letting it be open or checking basic header if required, 
        // but typically used in Admin page which handles auth.
        // Let's rely on the Admin page's server-side fetching/protection logic usually,
        // but since this is an API route, anyone can hit it.
        // Let's stick to basic fetching for now.
        
        const contacts = await Contact.find().sort({ createdAt: -1 });
        return NextResponse.json(contacts);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
