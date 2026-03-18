"use client";

import { motion, MotionValue, useTransform, useReducedMotion } from "framer-motion";
import { Users, IndianRupee, Hand } from "lucide-react";
import { landingContent } from "@/data/landingContent";

interface DashboardRevealProps {
    scrollYProgress: MotionValue<number>;
}

export function DashboardReveal({ scrollYProgress }: DashboardRevealProps) {
    const shouldReduceMotion = useReducedMotion();

    // Phase 3 fade in (35% to 45%)
    const globalOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
    const globalY = useTransform(scrollYProgress, [0.35, 0.45], [100, 0]);

    // Card slide-ins (staggered assembly)
    const cardsY = useTransform(scrollYProgress, [0.4, 0.55], [50, 0]);
    const studentsX = useTransform(scrollYProgress, [0.45, 0.6], [-100, 0]);
    const paymentsX = useTransform(scrollYProgress, [0.5, 0.65], [100, 0]);

    // Dashboard scale setup
    const scale = useTransform(scrollYProgress, [0.7, 0.85], [1, 0.95]);

    const { mockups } = landingContent;

    const DashboardContent = () => (
        <div className="w-full max-w-5xl mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
            {/* Fake Browser/App Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="font-heading font-semibold text-lg text-slate-800 dark:text-white hidden sm:block">
                    Classaathi Dashboard
                </div>
            </div>

            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                {/* Top Stats Row */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
                    style={{ y: shouldReduceMotion ? 0 : cardsY }}
                >
                    {/* Stat 1 */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Fees Collected</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{mockups.feesCollected}</div>
                        </div>
                    </div>
                    {/* Stat 2 */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-500/20 p-3 rounded-lg text-green-600 dark:text-green-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Students</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">245</div>
                        </div>
                    </div>
                    {/* Stat 3 */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-lg text-orange-600 dark:text-orange-400">
                            <Hand className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Attendance</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{mockups.attendance.present}/{mockups.attendance.total}</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Left Column: Student List */}
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
                        style={{ x: shouldReduceMotion ? 0 : studentsX }}
                    >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Recent Students</h3>
                            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">View All</button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {mockups.studentList.map((student, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">{student.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Class 10th - Physics</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">{student.amount}</div>
                                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${student.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                            }`}>
                                            {student.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Column: Attendance Toggle Mockup */}
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
                        style={{ x: shouldReduceMotion ? 0 : paymentsX }}
                    >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Mark Attendance — Today</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                <div className="font-medium text-slate-800 dark:text-white">Rahul Sharma</div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-green-500 text-white rounded font-medium text-sm shadow-sm ring-2 ring-green-500/20">Present</button>
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded font-medium text-sm transition-colors">Absent</button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex justify-between items-center opacity-70">
                                <div className="font-medium text-slate-800 dark:text-white">Priya Patel</div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded font-medium text-sm">Present</button>
                                    <button className="px-4 py-2 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded font-medium text-sm ring-1 ring-red-200 dark:ring-red-500/30">Absent</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );

    if (shouldReduceMotion) {
        return (
            <div className="w-full py-24 px-4 bg-accent-blue-light dark:bg-slate-900 relative">
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-center text-text-primary dark:text-white mb-12">
                    What if everything just... worked?
                </h2>
                <DashboardContent />
            </div>
        );
    }

    return (
        <motion.div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none px-4 lg:px-12"
            style={{ opacity: globalOpacity, y: globalY, scale }}
        >
            <div className="w-full relative pointer-events-auto">
                {/* Behind the dashboard glow */}
                <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full transform scale-110 -z-10" />

                <DashboardContent />
            </div>
        </motion.div>
    );
}
