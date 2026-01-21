import { Container } from "@/app/components/ui/Container";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen pt-20">
      {/* Skeleton Hero */}
      <div className="relative w-full h-[500px] bg-zinc-900 animate-pulse">
        <Container className="h-full flex flex-col justify-end pb-16">
          <div className="w-24 h-6 bg-zinc-800 rounded-full mb-4"></div>
          <div className="w-3/4 h-12 bg-zinc-800 rounded mb-6"></div>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-zinc-800 rounded"></div>
              <div className="w-20 h-3 bg-zinc-800 rounded"></div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-8">
            <div className="w-full h-4 bg-zinc-900 animate-pulse rounded"></div>
            <div className="w-5/6 h-4 bg-zinc-900 animate-pulse rounded"></div>
            <div className="w-full h-4 bg-zinc-900 animate-pulse rounded"></div>
            <div className="pt-10 space-y-6">
              <div className="w-full h-[300px] bg-zinc-900 animate-pulse rounded-2xl"></div>
              <div className="w-full h-4 bg-zinc-900 animate-pulse rounded"></div>
              <div className="w-full h-4 bg-zinc-900 animate-pulse rounded"></div>
              <div className="w-2/3 h-4 bg-zinc-900 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-8">
            <div className="w-full h-[400px] bg-zinc-900 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </Container>
    </div>
  );
}
