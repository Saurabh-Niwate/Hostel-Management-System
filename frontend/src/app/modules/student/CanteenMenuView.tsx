import React, { useState, useEffect } from "react";
import { Coffee, Utensils, UtensilsCrossed, Apple, Clock } from "lucide-react";
import { motion } from "motion/react";

export function CanteenMenuView() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/student/canteen-menu
    const menuData = [
        {
            id: 'breakfast',
            title: 'Breakfast',
            time: '07:30 AM - 09:30 AM',
            icon: <Coffee size={24} className="text-amber-600" />,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-100',
            items: ['Upma', 'Idli Sambar', 'Bread Butter', 'Boiled Egg', 'Tea & Coffee']
        },
        {
            id: 'lunch',
            title: 'Lunch',
            time: '12:30 PM - 02:30 PM',
            icon: <Utensils size={24} className="text-emerald-600" />,
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-100',
            items: ['Paneer Butter Masala', 'Dal Tadka', 'Jeera Rice', 'Roti', 'Salad', 'Gulab Jamun']
        },
        {
            id: 'snacks',
            title: 'Evening Snacks',
            time: '05:00 PM - 06:30 PM',
            icon: <Apple size={24} className="text-orange-600" />,
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-100',
            items: ['Samosa', 'Poha', 'Tea & Coffee']
        },
        {
            id: 'dinner',
            title: 'Dinner',
            time: '08:00 PM - 09:30 PM',
            icon: <UtensilsCrossed size={24} className="text-indigo-600" />,
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-100',
            items: ['Aloo Gobi', 'Dal Makhani', 'Steamed Rice', 'Chapati', 'Pickle']
        }
    ];

    useEffect(() => {
        setTimeout(() => setLoading(false), 400);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Today's Menu</h2>
                    <p className="text-slate-500 flex items-center mt-1">
                        <Clock size={16} className="mr-1" /> {today}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuData.map((meal, index) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        key={meal.id}
                        className={`p-6 rounded-2xl border ${meal.borderColor} bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
                    >
                        {/* Decorative background circle */}
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${meal.bgColor} opacity-50`}></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 rounded-xl ${meal.bgColor}`}>
                                        {meal.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{meal.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{meal.time}</p>
                                    </div>
                                </div>
                            </div>

                            <ul className="space-y-2">
                                {meal.items.map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-600">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-3"></span>
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
