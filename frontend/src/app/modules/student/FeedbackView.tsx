import React, { useState, useEffect } from "react";
import { MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export function FeedbackView() {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Maintenance");
    const [description, setDescription] = useState("");

    // Dummy Data for GET /api/student/feedback
    const [feedbacks, setFeedbacks] = useState([
        { id: 1, title: "AC not working in room A-101", category: "Maintenance", status: "Pending", date: "2024-03-10" },
        { id: 2, title: "Food quality issue", category: "Food", status: "Resolved", date: "2024-02-25" },
        { id: 3, title: "Wi-Fi disconnecting frequently", category: "Internet", status: "Pending", date: "2024-03-14" },
    ]);

    useEffect(() => {
        setTimeout(() => setLoading(false), 500);
    }, []);

    // POST /api/student/feedback simulation
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            const newFeedback = {
                id: feedbacks.length + 1,
                title,
                category,
                status: "Pending",
                date: new Date().toISOString().split('T')[0]
            };
            setFeedbacks([newFeedback, ...feedbacks]);
            setTitle("");
            setDescription("");
            setIsSubmitting(false);
            alert("Feedback submitted successfully!");
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Feedback & Complaints</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <MessageSquare className="mr-2 text-blue-600" size={20} /> New Feedback
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            >
                                <option value="Maintenance">Maintenance</option>
                                <option value="Food">Food / Canteen</option>
                                <option value="Internet">Internet / Wi-Fi</option>
                                <option value="Cleanliness">Cleanliness</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g., Fan is making noise"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Provide detailed information..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                            ></textarea>
                        </div>
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Send size={18} className="mr-2" />
                            )}
                            Submit Feedback
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Previous Feedbacks</h3>
                    {feedbacks.map((item, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={item.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-4 mb-3 md:mb-0">
                                <div className={`p-2 rounded-lg mt-1 ${item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {item.status === 'Resolved' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{item.category}</span>
                                        <span className="text-sm text-slate-400">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mt-1">{item.title}</h4>
                                </div>
                            </div>
                            <div className="ml-14 md:ml-0 flex items-center">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                    {item.status === 'Resolved' ? "Resolved" : "Pending Review"}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {feedbacks.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                            <p className="text-slate-500 font-medium">No feedbacks submitted yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
