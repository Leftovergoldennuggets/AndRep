import { createFileRoute } from "@tanstack/react-router";
import FlappyBirdGame from "@/components/FlappyBirdGame";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center">
      <FlappyBirdGame />
    </div>
  );
}
