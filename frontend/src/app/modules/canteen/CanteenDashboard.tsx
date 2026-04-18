import React, { useEffect, useState } from "react";
import { UtensilsCrossed, Vote, ChefHat, LogOut, Menu as MenuIcon, X, LayoutDashboard, User, Plus } from "lucide-react";
import { CanteenOverview } from "./CanteenOverview";
import { MenuManagement } from "./MenuManagement";
import { DinnerPollManagement } from "./DinnerPollManagement";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "dinnerPolls" | "profile">("overview");

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
    <div className={`min-h-screen ${theme.bg} flex`}>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`fixed top-0 left-0 h-full w-[280px] flex flex-col transition-transform duration-300 text-white z-30 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-3">
              <ChefHat className={`h-5 w-5 ${theme.text}`} />
              <div>
                <h1 className={`text-xl font-bold tracking-wide truncate ${theme.text}`}>Canteen Portal</h1>
                  <p className={`text-xs ${theme.muted}`}>{getStoredIdentifier() || "CANTEEN OWNER"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg lg:hidden ${theme.text} hover:bg-white/10`}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => { setActiveTab("overview"); setIsMobileMenuOpen(false); }}
              theme={theme}
            />
            <SidebarItem
              icon={<UtensilsCrossed className="w-5 h-5" />}
              label="Menu Management"
              active={activeTab === "menu"}
              onClick={() => { setActiveTab("menu"); setIsMobileMenuOpen(false); }}
              theme={theme}
            />
            <SidebarItem
              icon={<Vote className="w-5 h-5" />}
              label="Dinner Polls"
              active={activeTab === "dinnerPolls"}
              onClick={() => { setActiveTab("dinnerPolls"); setIsMobileMenuOpen(false); }}
              theme={theme}
            />
            <SidebarItem
              icon={<User className="w-5 h-5" />}
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => { setActiveTab("profile"); setIsMobileMenuOpen(false); }}
              theme={theme}
            />
          </nav>

          <div className="p-4 border-t border-white/20">
            <button
              onClick={() => { api.post("/auth/logout").catch(() => undefined).finally(() => { clearAuthSession(); navigate("/"); }); }}
              className="flex items-center w-full gap-3 px-4 py-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-colors border border-slate-200 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] transition-all duration-300 min-h-[101vh]">
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
              <div className="mb-6 flex items-center justify-between gap-4 min-h-[44px]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm"
                  >
                    <MenuIcon className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-none">
                      {activeTab === "overview"
                        ? "Canteen Dashboard"
                        : activeTab === "menu"
                          ? "Menu Management"
                          : activeTab === "dinnerPolls"
                            ? "Dinner Polls"
                            : "My Profile"}
                    </h2>
                  </div>
                </div>
                {renderHeaderAction() && <div className="shrink-0 flex items-center">{renderHeaderAction()}</div>}
              </div>

              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, theme }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
        active
          ? "text-white shadow-lg"
          : `${theme.text} hover:bg-white/10`
      }`}
      style={active ? { backgroundColor: theme.activeColor } : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
                         
      
