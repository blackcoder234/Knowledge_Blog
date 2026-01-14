import Link from 'next/link';

export const TableOfContents = () => {
  const sections = [
      { id: 'intro', label: 'Introduction' },
      { id: 'impact', label: 'The Impact on Economy' },
      { id: 'challenges', label: 'Key Challenges' },
      { id: 'future', label: 'Future Outlook' },
      { id: 'conclusion', label: 'Conclusion' },
  ];

  return (
    <div className="sticky top-24 rounded-xl border border-white/10 bg-card p-6">
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Table of Contents</h4>
      <ul className="flex flex-col gap-3">
        {sections.map((sec) => (
            <li key={sec.id}>
                <Link href={`#${sec.id}`} className="text-sm text-muted hover:text-accent transition-colors block border-l-2 border-transparent hover:border-accent pl-3 -ml-px">
                  {sec.label}
                </Link>
            </li>
        ))}
      </ul>
    </div>
  );
};
