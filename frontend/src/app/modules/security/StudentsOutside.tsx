import React, { useState, useEffect } from "react";
import { MapPin, Search } from "lucide-react";
import { motion } from "motion/react";

export function StudentsOutside() {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Dummy Data for GET /api/security/students-outside
    const outsideList = [
        { id: "STU2024101", name: "John Doe", room: "A-101", outSince: "Today, 09:30 AM", expectedReturn: "25th Mar", reason: "Family Function" },
        { id: "STU2024112", name: "Emma Davis", room: "A-302", outSince: "Today, 07:00 AM", expectedReturn: "Tomorrow", reason: "Going Home" },
        { id: "STU2024089", name: "Chris Evans", room: "C-105", outSince: "Yesterday, 06:00 PM", expectedReturn: "Today", reason: "Medical Appointment" },
    ];

    useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    const filteredList = outsideList.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.room.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Students Currently Outside</h2>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, ID, or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full md:w-80 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredList.map((student, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={student.id}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full"
                    >
                        <div className="absolute top-0 right-0 p-3 bg-amber-50 text-amber-700 rounded-bl-xl font-bold text-xs uppercase tracking-wider">
                            Outside
                        </div>

                        <div className="flex items-start space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-teal-600 bg-teal-50">
                                {student.name.charAt(0)}
                            </div>
                            <div className="mt-1">
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{student.name}</h3>
                                <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded">{student.id}</span>
                                    <span className="ml-2 flex items-center"><MapPin size={10} className="mr-0.5" /> {student.room}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Out Since:</span>
                                <span className="font-medium text-slate-800">{student.outSince}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Return By:</span>
                                <span className="font-medium text-slate-800">{student.expectedReturn}</span>
                            </div>
                            <div className="mt-1 pt-2 border-t border-slate-200/60">
                                <p className="text-slate-600 italic text-xs truncate">"{student.reason}"</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredList.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <p className="text-slate-500 font-medium">No students found outside matching criteria.</p>
                </div>
            )}
        </div>
    );
}
