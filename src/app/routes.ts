import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { Home } from "./pages/Home";
import { IooiTV } from "./pages/IooiTV";
import { Workspace } from "./pages/Workspace";
import { InfiniteCanvas } from "./components/InfiniteCanvas";
import { ErrorBoundary } from "./ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    ErrorBoundary: ErrorBoundary,
    children: [
      { index: true, Component: Home },
      { path: "iooitv", Component: IooiTV },
      { path: "taptv", Component: IooiTV },
      { path: "workspace", Component: Workspace },
    ],
  },
  {
    path: "/canvas",
    Component: InfiniteCanvas,
    ErrorBoundary: ErrorBoundary,
  }
]);