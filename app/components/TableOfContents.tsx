import Link from "next/link";

export const TableOfContents = () => {
  const sections = [
    { id: "intro", label: "Introduction" },
    { id: "impact", label: "The Impact on Economy" },
    { id: "challenges", label: "Key Challenges" },
    { id: "future", label: "Future Outlook" },
    { id: "conclusion", label: "Conclusion" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
      <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
        Contents
      </h4>
      <ul className="flex flex-col gap-4">
        {sections.map((sec) => (
          <li key={sec.id}>
            <Link
              href={`#${sec.id}`}
              className="text-sm text-zinc-400 hover:text-white transition-colors block border-l-2 border-white/5 hover:border-accent pl-4 -ml-px py-1"
            >
              {sec.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
