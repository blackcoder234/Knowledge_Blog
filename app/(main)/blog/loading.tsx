import { Container } from "@/app/components/ui/Container";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <Container>
        {/* Helper layout skeletal */}
        <div className="flex flex-col gap-12">
          {/* Header Skeleton */}
          <div className="w-full h-[300px] md:h-[400px] bg-zinc-900 animate-pulse rounded-2xl border border-white/5" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row gap-6 border-b border-white/5 pb-8"
                >
                  <div className="w-full md:w-72 h-52 bg-zinc-900 animate-pulse rounded-xl" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4 w-24 bg-zinc-900 animate-pulse rounded" />
                    <div className="h-8 w-3/4 bg-zinc-900 animate-pulse rounded" />
                    <div className="h-4 w-full bg-zinc-900 animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-zinc-900 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 hidden lg:block space-y-8">
              <div className="h-64 bg-zinc-900 animate-pulse rounded-3xl" />
              <div className="h-96 bg-zinc-900 animate-pulse rounded-3xl" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
