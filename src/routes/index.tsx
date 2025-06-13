import { createFileRoute } from "@tanstack/react-router";
import FlappyBirdGame from "@/components/FlappyBirdGame";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  console.log("HomePage loading, about to render FlappyBirdGame");
  return (
    <div className="w-full h-full fixed inset-0 overflow-hidden">
      <FlappyBirdGame />
    </div>
  );
}
