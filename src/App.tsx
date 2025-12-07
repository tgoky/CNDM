import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/web3'
import { Navigation } from '@/components/Navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import CreateListing from "./pages/CreateListing";
import Profile from "./pages/Profile";
import CreateProfile from "./pages/CreateProfile";
import ListingDetail from "./pages/ListingDetail";
import LearningSession from "./pages/ContractTest";
import IPFSTest from "./pages/IPFSTest";
import FullProcessTest from "./pages/FullProcessTest";
import EndToEndSessionTest from "./pages/EndToEndSessionTest";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Navigation />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/my-listings" element={<Marketplace />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/create" element={<CreateListing />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-profile" element={<CreateProfile />} />
                <Route path="/reputation" element={<Profile />} />
                <Route path="/learning-session/:id" element={<LearningSession />} />
                <Route path="/contract-test" element={<LearningSession />} />
                <Route path="/ipfs-test" element={<IPFSTest />} />
                <Route path="/full-process-test" element={<FullProcessTest />} />
                <Route path="/end-to-end-test" element={<EndToEndSessionTest />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
