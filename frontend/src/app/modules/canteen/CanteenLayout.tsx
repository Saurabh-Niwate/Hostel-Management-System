import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Vote, LogOut, Menu, X, ChefHat, User, Plus } from "lucide-react";
import { motion } from "motion/react";

export function CanteenLayout() {
  const theme = {
    color: "#b45309",
    activeColor: "#d97706",
    bg: "bg-amber-50",
    text: "text-white",
    muted: "text-white/80",
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "Canteen Owner") {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userIdentifier");
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/canteen-owner-dashboard" },
    { icon: UtensilsCrossed, label: "Menu Management", path: "/canteen-owner-dashboard/menu" },
    { icon: Vote, label: "Dinner Polls", path: "/canteen-owner-dashboard/dinner-polls" },
    { icon: User, label: "Profile", path: "/canteen-owner-dashboard/profile" }
  ];

  const pageTitle = menuItems.find((item) => item.path === location.pathname)?.label || "Canteen Owner Dashboard";
  const headerAction =
    location.pathname === "/canteen-owner-dashboard/menu" ? (
      <button
        onClick={() => window.dispatchEvent(new Event("canteen:create-menu-item"))}
        className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-all font-medium"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Menu Item
      </button>
    ) : location.pathname === "/canteen-owner-dashboard/dinner-polls" ? (
      <button
        onClick={() => window.dispatchEvent(new Event("canteen:create-poll"))}
        className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-all font-medium"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Poll
      </button>
    ) : null;

  return (
    <div className={`min-h-screen ${theme.bg} flex`}>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`fixed h-full z-30 flex flex-col transition-transform duration-300 text-white ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: theme.color, borderRight: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3">
            <ChefHat className={`h-5 w-5 ${theme.text}`} />
            <div>
              <h1 className={`text-xl font-bold tracking-wide truncate ${theme.text}`}>Canteen Portal</h1>
              <p className={`text-xs ${theme.muted}`}>{localStorage.getItem("userIdentifier") || "CANTEEN"}</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`lg:hidden p-2 rounded-lg ${theme.text} hover:bg-white/10`}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/canteen-owner-dashboard"}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold ${
                  isActive ? "text-white shadow-lg" : "text-white/90 hover:bg-white/10 hover:text-white"
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: theme.activeColor } : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button onClick={handleLogout} className="flex items-center w-full p-3 bg-white text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm">
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-20" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-3xl font-bold text-slate-900">{pageTitle}</h2>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
