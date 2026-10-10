import { useEffect } from "react";
import { ConstellationField } from "../fx/ConstellationField";
import { TopBar } from "../components/TopBar";
import { Home } from "./screens/Home";
import { DrillScreen } from "./screens/DrillScreen";
import { Faculties } from "./screens/Faculties";
import { PrePost } from "./screens/PrePost";
import { Settings } from "./screens/Settings";
import { useAppStore } from "./store";

export function App() {
  const screen = useAppStore((s) => s.screen);
  const loadSoundPrefs = useAppStore((s) => s.loadSoundPrefs);
  // drills and batteries get a quiet backdrop so nothing competes with a stimulus
  const calm = screen.name === "drill" || screen.name === "prepost";

  useEffect(() => {
    void loadSoundPrefs();
  }, [loadSoundPrefs]);

  return (
    <>
      <ConstellationField calm={calm} />
      <div className="relative z-10 flex min-h-full w-full justify-center">
        <div className="flex min-h-screen w-full max-w-md flex-col px-4 pt-4 pb-7 sm:px-5 md:max-w-3xl">
          <TopBar />
          <main
            key={screen.name === "drill" ? `drill-${screen.id}` : screen.name}
            className="screen-enter flex flex-1 flex-col"
          >
            {screen.name === "home" && <Home />}
            {screen.name === "drill" && (
              <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
                <DrillScreen key={screen.id} id={screen.id} />
              </div>
            )}
            {screen.name === "faculties" && <Faculties />}
            {screen.name === "prepost" && (
              <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
                <PrePost />
              </div>
            )}
            {screen.name === "settings" && (
              <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
                <Settings />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
