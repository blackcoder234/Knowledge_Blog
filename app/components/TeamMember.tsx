import Image from 'next/image';

interface TeamMemberProps {
    name: string;
    role: string;
    description: string;
    imageUrl: string;
}

export const TeamMember = ({ name, role, description, imageUrl }: TeamMemberProps) => {
  return (
    <div className="group relative rounded-xl bg-card border border-white/5 p-6 transition-all hover:border-accent/30 hover:-translate-y-1">
      <div className="relative mb-6 h-24 w-24 rounded-full overflow-hidden border-2 border-white/10 mx-auto group-hover:border-accent transition-colors">
        <Image 
            src={imageUrl} 
            alt={name} 
            fill 
            className="object-cover"
        />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent transition-colors">{name}</h3>
        <p className="text-xs font-bold uppercase tracking-wider text-accent mb-4">{role}</p>
        <p className="text-sm text-muted leading-relaxed">
            {description}
        </p>
      </div>
    </div>
  );
};
