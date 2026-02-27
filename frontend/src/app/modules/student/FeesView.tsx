import React, { useState, useEffect } from "react";
import { CreditCard, Receipt, FileText, Download } from "lucide-react";
import { motion } from "motion/react";

export function FeesView() {
    const [loading, setLoading] = useState(true);

    // Dummy Data for GET /api/student/fees
    const feeData = {
        totalFees: 120000,
        paidFees: 80000,
        pendingFees: 40000,
        dueDate: "2024-05-01",
        history: [
            { id: "TXN1001", date: "2024-01-15", amount: 40000, status: "Paid", term: "Term 1" },
            { id: "TXN1002", date: "2024-03-01", amount: 40000, status: "Paid", term: "Term 2" },
            { id: "TXN1003", date: "2024-05-01", amount: 40000, status: "Pending", term: "Term 3" },
        ]
    };

    useEffect(() => {
        setTimeout(() => setLoading(false), 700);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const progressPercentage = (feeData.paidFees / feeData.totalFees) * 100;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Fee Details</h2>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h3 className="text-slate-500 font-medium">Pending Balance</h3>
                        <p className="text-4xl font-bold text-red-600 mt-2">₹{feeData.pendingFees.toLocaleString()}</p>
                        <p className="text-sm text-slate-500 mt-1 flex items-center">
                            <FileText size={14} className="mr-1" /> Due by {new Date(feeData.dueDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-emerald-600">Paid: ₹{feeData.paidFees.toLocaleString()}</span>
                        <span className="text-slate-600">Total: ₹{feeData.totalFees.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                            className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Transaction History</h3>
            <div className="grid grid-cols-1 gap-4">
                {feeData.history.map((txn, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={txn.id}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between"
                    >
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className={`p-3 rounded-xl ${txn.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Receipt size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{txn.term} Fee</h4>
                                <p className="text-sm text-slate-500">Txn ID: {txn.id} • {new Date(txn.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between md:flex-col md:items-end w-full md:w-auto">
                            <p className="text-xl font-bold text-slate-800">₹{txn.amount.toLocaleString()}</p>
                            <div className="flex items-center space-x-3 mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${txn.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {txn.status}
                                </span>
                                {txn.status === 'Paid' && (
                                    <button className="text-blue-600 hover:text-blue-800" title="Download Receipt">
                                        <Download size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
