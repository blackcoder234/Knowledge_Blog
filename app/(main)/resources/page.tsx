import { Suspense } from "react";
import { Container } from "../../components/ui/Container";
import { FilterBar } from "../../components/ui/FilterBar";
import { ResourceCard } from "../../components/ResourceCard";

const resources = [
  {
      title: "The State of AI 2024",
      description: "A comprehensive report on the advancements, challenges, and future trajectory of Artificial Intelligence globally.",
      type: "Report" as const,
      size: "12.5 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=AI+Report"
  },
  {
      title: "Quantum Computing for Beginners",
      description: "An essential guide to understanding the principles of qubits, superposition, and quantum entanglement.",
      type: "Ebook" as const,
      size: "4.2 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=Quantum+Ebook"
  },
  {
      title: "Ethical Guidelines for GenAI",
      description: "Best practices for implementing generative AI models in enterprise environments securely and ethically.",
      type: "Whitepaper" as const,
      size: "2.8 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=Ethics+Paper"
  },
  {
      title: "Space Tech Market Analysis",
      description: "Investment trends and market predictions for the commercial space sector through 2030.",
      type: "Report" as const,
      size: "18.1 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=Space+Market"
  },
   {
      title: "Neural Interfaces Development",
      description: "Technical specifications and current research on brain-computer interface technologies.",
      type: "Whitepaper" as const,
      size: "5.5 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=BCI+Tech"
  },
   {
      title: "Building Agentic Workflows",
      description: "A practical handbook for developers looking to implement autonomous AI agents in their stack.",
      type: "Ebook" as const,
      size: "8.9 MB",
      imageUrl: "https://placehold.co/600x400/222/FFF?text=Agentic+AI"
  },
];

export default function ResourcesPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container>
         <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Knowledge Hub
            </h1>
            <p className="text-muted text-lg">
                Access our curated library of whitepapers, reports, and ebooks to deepen your understanding of the technologies of tomorrow.
            </p>
         </div>

         <Suspense fallback={<div className="text-zinc-500 text-sm mb-10">Loading filters...</div>}>
            <FilterBar 
                categories={['Ebooks', 'Whitepapers', 'Reports', 'CASE Studies']} 
                activeCategory="All" 
            />
         </Suspense>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res, idx) => (
                <ResourceCard key={idx} resource={res} />
            ))}
         </div>
      </Container>
    </div>
  );
}
