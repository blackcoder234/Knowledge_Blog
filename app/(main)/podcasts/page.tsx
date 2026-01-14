import { Container } from "../../components/ui/Container";
import { PodcastCard } from "../../components/PodcastCard";
import { Button } from "../../components/ui/Button";

const podcasts = [
  {
      id: "42",
      title: "The Singularity is Nearer",
      host: "Lex Fridman",
      guest: "Ray Kurzweil",
      date: "Oct 18, 2024",
      duration: "2 hr 45 min",
      description: "Discussing the exponential growth of computing, genetics, nanotechnology, and robotics. Are we ready for the merger of human and machine intelligence?",
      imageUrl: "https://placehold.co/400x400/111/FFF?text=EP+42"
  },
  {
      id: "41",
      title: "Decoding the Black Box",
      host: "Lex Fridman",
      guest: "Ilya Sutskever",
      date: "Oct 11, 2024",
      duration: "1 hr 30 min",
      description: "A deep dive into the interpretability of large language models and the path towards Artificial General Intelligence (AGI).",
      imageUrl: "https://placehold.co/400x400/222/FFF?text=EP+41"
  },
  {
      id: "40",
      title: "Mars Colony: The Engineering Challenge",
      host: "Lex Fridman",
      guest: "Elon Musk",
      date: "Oct 04, 2024",
      duration: "3 hr 10 min",
      description: "The technical hurdles of Starship, life support systems on Mars, and the timeline for becoming a multi-planetary species.",
      imageUrl: "https://placehold.co/400x400/333/FFF?text=EP+40"
  },
  {
      id: "39",
      title: "Quantum Encryption vs. Privacy",
      host: "Lex Fridman",
      guest: "Edward Snowden",
      date: "Sep 27, 2024",
      duration: "2 hr 15 min",
      description: "How post-quantum cryptography will reshape internet security and the ongoing battle for digital privacy.",
      imageUrl: "https://placehold.co/400x400/444/FFF?text=EP+39"
  },
];

export default function PodcastsPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container>
         <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    KnowledgeLog <span className="text-accent">Talks</span>
                </h1>
                <p className="text-muted text-lg">
                    In-depth conversations with the visionaries, engineers, and philosophers building the future.
                </p>
            </div>
            <div className="flex gap-3">
                 <Button variant="outline">Apple Podcasts</Button>
                 <Button variant="outline">Spotify</Button>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            {podcasts.map((pod, idx) => (
                <PodcastCard key={pod.id} podcast={pod} active={idx === 0} />
            ))}
         </div>
         
         <div className="mt-12 text-center">
             <Button variant="ghost">Load More Episodes</Button>
         </div>
      </Container>
    </div>
  );
}
