export interface MenuItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages';
  price: number;
  available: boolean;
  preparationTime: number; // in minutes
  isVeg: boolean;
  description: string;
  ingredients?: string[];
}

export interface MenuPoll {
  id: string;
  pollId: string;
  title: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  date: string;
  status: 'Active' | 'Closed' | 'Scheduled';
  options: MenuOption[];
  totalVotes: number;
  createdAt: string;
  closesAt: string;
  winningOption?: string;
}

export interface MenuOption {
  id: string;
  name: string;
  description: string;
  items: string[]; // Menu items included in this option
  votes: number;
  percentage: number;
  isVeg: boolean;
}

export interface StudentVote {
  studentId: string;
  studentName: string;
  roomNo: string;
  optionId: string;
  votedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Grains' | 'Dairy' | 'Spices' | 'Others';
  quantity: number;
  unit: string;
  minimumStock: number;
  lastUpdated: string;
  expiryDate?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface DailyStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  participationRate: number;
  popularChoices: { name: string; votes: number }[];
  upcomingMeals: { meal: string; status: string; votes: number }[];
}