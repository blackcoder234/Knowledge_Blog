import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";

export const revalidate = 0;

async function getMessages() {
  await dbConnect();
  const messages = await Contact.find().sort({ createdAt: -1 }).lean();
  return messages.map((m: any) => ({
    ...m,
    _id: m._id.toString(),
    createdAt: m.createdAt.toISOString(),
  }));
}

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-zinc-400">View inquiries from the contact form.</p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 text-xs uppercase font-bold text-white">
              <tr>
                <th className="px-6 py-3">From</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {messages.map((msg: any) => (
                <tr
                  key={msg._id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      {msg.firstName} {msg.lastName}
                    </div>
                    <div className="text-xs text-zinc-500">{msg.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                      {msg.subject}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 max-w-xs truncate"
                    title={msg.message}
                  >
                    {msg.message}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No messages received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
