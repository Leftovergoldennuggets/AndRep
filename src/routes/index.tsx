import { createFileRoute } from "@tanstack/react-router";
import FlappyBirdGame from "@/components/FlappyBirdGameRefactored";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="w-full h-full fixed inset-0 overflow-hidden">
      <FlappyBirdGame />
    </div>
  );
}
