import { lazy, Suspense, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Studio = lazy(() => import("./pages/Studio.jsx"));
const Templates = lazy(() => import("./pages/Templates.jsx"));
const Saved = lazy(() => import("./pages/Saved.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const PAGE_TITLES = {
  "/": "Universal Diagram & Chart Studio",
  "/studio": "Studio",
  "/templates": "Templates",
  "/saved": "Projects",
  "/formats": "Formats & features",
};

function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `DiagramAtlas — ${PAGE_TITLES[pathname] || "Page not found"}`;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Suspense
          fallback={
            <div
              role="status"
              className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground"
            >
              Opening workspace…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      {pathname !== "/studio" && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Landing />} />
          <Route path="studio" element={<Studio />} />
          <Route path="templates" element={<Templates />} />
          <Route path="saved" element={<Saved />} />
          <Route path="formats" element={<Compare />} />
          <Route path="compare" element={<Navigate to="/formats" replace />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
