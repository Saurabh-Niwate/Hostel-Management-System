import React, { useEffect, useState } from "react";
import { UtensilsCrossed, Vote, ChefHat, LogOut, Menu as MenuIcon, X, LayoutDashboard, User, Plus, Sparkles } from "lucide-react";
import { CanteenOverview } from "./CanteenOverview";
import { MenuManagement } from "./MenuManagement";
import { DinnerPollManagement } from "./DinnerPollManagement";
import { AICanteenHub } from "./AICanteenHub";
import { StaffProfileSettings } from "../../components/StaffProfileSettings";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";
import { clearAuthSession, getStoredIdentifier, getStoredRole, getStoredToken } from "../../lib/authStorage";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isOpen: boolean;
  theme: {
    color: string;
    activeColor: string;
    bg: string;
    text: string;
    muted: string;
  };
};

export function CanteenDashboard() {
  const navigate = useNavigate();
  const theme = {
    color: "#b45309",
    activeColor: "#d97706",
    bg: "bg-amber-50",
    text: "text-white",
    muted: "text-white/80",
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "dinnerPolls" | "profile" | "aiHub">("overview");

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();
    if (!token || role !== "Canteen Owner") {
      navigate("/");
    }
  }, [navigate]);

  function renderHeaderAction() {
    if (activeTab === "menu") {
      return (
        <button onClick={() => window.dispatchEvent(new Event("canteen:create-menu-item"))} className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-all font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </button>
      );
    }
    if (activeTab === "dinnerPolls") {
      return (
        <button onClick={() => window.dispatchEvent(new Event("canteen:create-poll"))} className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-all font-medium">
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </button>
      );
    }
    return null;
  }

  function renderContent() {
    switch (activeTab) {
      case "overview":
        return <CanteenOverview onNavigate={setActiveTab} />;

      case "menu":
        return <MenuManagement />;

      case "dinnerPolls":
        return <DinnerPollManagement />;

      case "aiHub":
        return <AICanteenHub />;

      case "profile":
        return (
          <div className="space-y-6">
            <StaffProfileSettings />
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col md:flex-row`}>
      {/* Mobile Top Navbar */}
      <header className="md:hidden flex h-16 items-center justify-between px-6 text-white z-20 shadow-md w-full shrink-0" style={{ backgroundColor: theme.color }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Canteen Portal</h1>
        </div>
        <div className="text-xs text-white/80 font-medium">{getStoredIdentifier() || "CANTEEN OWNER"}</div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && typeof window !== "undefined" && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : 80,
          x: typeof window !== "undefined" && window.innerWidth < 768 ? (isSidebarOpen ? 0 : -280) : 0
        }}
        transition={{ type: "tween", duration: 0.25 }}
        className="text-white fixed md:sticky top-0 left-0 h-full md:h-screen z-30 flex flex-col shrink-0"
        style={{
          backgroundColor: theme.color,
          borderRight: "1px solid rgba(255,255,255,0.18)",
          width: isSidebarOpen ? 280 : 80
        }}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/20 h-16 md:h-auto">
          {isSidebarOpen ? (
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-wide truncate">Canteen Portal</h1>
              <p className="text-xs text-white/80 truncate">{getStoredIdentifier() || "CANTEEN OWNER"}</p>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/15">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:inline-block hidden">
            <MenuIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg md:hidden">
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => { setActiveTab("overview"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          <SidebarItem
            icon={<UtensilsCrossed className="w-5 h-5 shrink-0" />}
            label="Menu Management"
            active={activeTab === "menu"}
            onClick={() => { setActiveTab("menu"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          <SidebarItem
            icon={<Vote className="w-5 h-5 shrink-0" />}
            label="Dinner Polls"
            active={activeTab === "dinnerPolls"}
            onClick={() => { setActiveTab("dinnerPolls"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          <SidebarItem
            icon={<Sparkles className="w-5 h-5 shrink-0 text-amber-300 animate-pulse" />}
            label="AI Canteen Hub"
            active={activeTab === "aiHub"}
            onClick={() => { setActiveTab("aiHub"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
          <SidebarItem
            icon={<User className="w-5 h-5 shrink-0" />}
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => { setActiveTab("profile"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            isOpen={isSidebarOpen}
            theme={theme}
          />
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={() => { api.post("/auth/logout").catch(() => undefined).finally(() => { clearAuthSession(); navigate("/"); }); }}
            className={`flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium truncate">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 transition-all duration-300 min-h-[101vh] overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[60vh]"
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[44px]">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-none flex items-center gap-2">
                      {activeTab === "overview"
                        ? "Canteen Dashboard"
                        : activeTab === "menu"
                          ? "Menu Management"
                          : activeTab === "dinnerPolls"
                            ? "Dinner Polls"
                            : activeTab === "aiHub"
                              ? (
                                <>
                                  <Sparkles className="h-6 w-6 text-amber-600 animate-pulse" />
                                  <span>AI Canteen Hub</span>
                                </>
                              )
                              : "My Profile"}
                    </h2>
                  </div>
                </div>
                {renderHeaderAction() && <div className="sm:shrink-0 flex items-center">{renderHeaderAction()}</div>}
              </div>

              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isOpen, theme }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-xl transition-colors font-medium ${
        active ? "text-white" : "text-white/80 hover:bg-white/5"
      } ${!isOpen && "justify-center"}`}
      style={active ? { backgroundColor: theme.activeColor } : undefined}
    >
      {icon}
      {isOpen && <span className="ml-3 truncate">{label}</span>}
    </button>
  );
}
                         
      
