import { Home } from "./screens/Home";
import { DrillScreen } from "./screens/DrillScreen";
import { Faculties } from "./screens/Faculties";
import { PrePost } from "./screens/PrePost";
import { useAppStore } from "./store";

export function App() {
  const screen = useAppStore((s) => s.screen);

  return (
    <div className="flex min-h-full w-full justify-center">
      <div className="flex min-h-screen w-full max-w-md flex-col px-5 py-7">
        {screen.name === "home" && <Home />}
        {screen.name === "drill" && <DrillScreen key={screen.id} id={screen.id} />}
        {screen.name === "faculties" && <Faculties />}
        {screen.name === "prepost" && <PrePost />}
      </div>
    </div>
  );
}
