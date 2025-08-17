import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JuristSidebar } from "@/components/JuristSidebar";
import { TopHeader } from "@/components/TopHeader";
import Index from "./pages/Index";
import Search from "./pages/Search";
import JTL from "./pages/JTL";
import Marketplace from "./pages/Marketplace";
import Jobs from "./pages/Jobs";
import JudgeNotes from "./pages/JudgeNotes";
import Diary from "./pages/Diary";
import Cases from "./pages/Cases";
import Upgrade from "./pages/Upgrade";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <JuristSidebar />
            <div className="flex-1 flex flex-col">
              <TopHeader />
              <main className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/jtl" element={<JTL />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/judge-notes" element={<JudgeNotes />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="/history" element={<History />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
