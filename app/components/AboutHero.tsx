import { Container } from "../components/ui/Container";

export const AboutHero = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <Container className="relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            We Are <span className="text-accent">KnowledgeLog</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Bridging the gap between complex innovation and human understanding. 
            We are a team of engineers, researchers, and storytellers dedicated to decoding the future.
        </p>
      </Container>
    </section>
  );
};
