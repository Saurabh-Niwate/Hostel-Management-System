import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Vote, LogOut, Menu, X, ChefHat, User } from "lucide-react";
import { motion } from "motion/react";

export function CanteenLayout() {
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: 280 }}
        className={`fixed h-full z-30 flex flex-col bg-orange-900 border-r border-orange-800 text-white transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-orange-800/50">
          <div className="flex items-center gap-3">
            <ChefHat className="h-5 w-5 text-orange-300" />
            <div>
              <h1 className="text-xl font-bold tracking-wide truncate">Canteen Portal</h1>
              <p className="text-xs text-orange-200">{localStorage.getItem("userIdentifier") || "CANTEEN"}</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 hover:bg-orange-800 rounded-lg">
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
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? "bg-orange-600 text-white shadow-lg shadow-orange-950/40" : "text-orange-100 hover:bg-orange-800 hover:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-orange-800/50">
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-red-200 hover:bg-red-900/30 rounded-xl transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 lg:hidden z-20" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 p-8 ml-0 lg:ml-[280px] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              {menuItems.find((item) => item.path === location.pathname)?.label || "Canteen Owner Dashboard"}
            </h2>
            <p className="text-slate-500 mt-1">
              Daily menu updates and student dinner voting for hostel meals.
            </p>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
