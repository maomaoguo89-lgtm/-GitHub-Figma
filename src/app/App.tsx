import React, { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { AnimatePresence } from "motion/react";
import { router } from "./routes";
import { LoadingScreen } from "./components/LoadingScreen";
import { SettingsModal } from "./components/SettingsModal";
import { useUIStore } from "./store/uiStore";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { isSettingsOpen, closeSettings } = useUIStore();

  useEffect(() => {
    // 模拟初始化加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading"
            onComplete={() => setIsLoading(false)}
          />
        )}
      </AnimatePresence>

      {!isLoading && <RouterProvider router={router} />}

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
      />
    </>
  );
}