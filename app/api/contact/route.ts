import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'super_admin'].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();
        const contacts = await Contact.find().sort({ createdAt: -1 });
        return NextResponse.json(contacts);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
