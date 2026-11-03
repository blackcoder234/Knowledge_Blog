"use client";

import { History } from "lucide-react";

interface AuditLogTabProps {
  logs: any[];
}

export default function AuditLogTab({ logs }: AuditLogTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <span>Immutable AI &amp; Editorial Audit Trail</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Chronological audit log of all autonomous research syncs, draft generations, and human editorial decisions.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0A0A0A]">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th className="p-3.5 pl-4">Timestamp</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5 pr-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-500">
                  No activity logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 pl-4 text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        log.action === "limit_exceeded"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : log.action === "draft_generated"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : log.action === "quality_reviewed"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="capitalize text-zinc-300 font-medium">
                      {log.actorType}
                    </span>
                  </td>
                  <td className="p-3.5 pr-4 text-right text-zinc-400 font-mono text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

