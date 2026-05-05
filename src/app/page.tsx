import { Center } from "@/components/layout/Center";
import { HomeActions } from "@/components/home/HomeActions";

const HomePage = () => (
  <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 text-center">
    <div className="space-y-4">
      <Center className="gap-3">
        <h1 className="text-5xl font-bold tracking-tight">Code Clash</h1>
      </Center>
      <p className="text-muted-foreground text-lg">
        Competitive LeetCode. Real-time.
      </p>
    </div>
    <HomeActions />
  </main>
);

export default HomePage;
