'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Target,
    Clock,
    AlertTriangle,
    CheckCircle,
    Star,
    Filter,
    Calendar,
    X,
    MoreVertical,
    Edit,
    Trash2,
    Menu,
    ChevronLeft,
    RefreshCw,
    Flag,
    Sun,
    Moon,
    TrendingUp,
    Activity,
    Zap,
    BarChart3,
} from 'lucide-react';
import VoiceCommandButton from './VoiceCommandButton';
import ParticlesBackground from './ParticlesBackground';

// Types
interface Mission {
    id: string;
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'active' | 'completed' | 'failed';
    dueDate: string;
    createdAt: string;
    tags: string[];
    category: string;
    recursion?: string;
}

interface MissionTab {
    id: string;
    label: string;
    icon: React.ReactNode;
    count: number;
}

// Mock data
const mockMissions: Mission[] = [
    {
        id: '1',
        title: 'Secure Database Perimeter',
        description: 'Implement advanced encryption protocols for the main database infrastructure.',
        priority: 'critical',
        status: 'active',
        dueDate: '2025-01-20',
        createdAt: '2025-01-15T10:30:00Z',
        tags: ['security', 'database'],
        category: 'Infrastructure',
        recursion: 'Weekly',
    },
    {
        id: '2',
        title: 'Deploy Surveillance Network',
        description: 'Set up monitoring systems across all entry points.',
        priority: 'high',
        status: 'pending',
        dueDate: '2025-01-22',
        createdAt: '2025-01-14T08:00:00Z',
        tags: ['surveillance', 'security'],
        category: 'Operations',
    },
    {
        id: '3',
        title: 'Extract Intelligence Report',
        description: 'Compile quarterly security assessment.',
        priority: 'medium',
        status: 'completed',
        dueDate: '2025-01-18',
        createdAt: '2025-01-10T14:00:00Z',
        tags: ['reporting', 'intel'],
        category: 'Analysis',
        recursion: 'Monthly',
    },
    {
        id: '4',
        title: 'Update Firewall Configuration',
        description: 'Apply latest security patches to all firewall systems.',
        priority: 'high',
        status: 'pending',
        dueDate: '2025-01-25',
        createdAt: '2025-01-16T09:00:00Z',
        tags: ['security', 'maintenance'],
        category: 'Infrastructure',
    },
    {
        id: '5',
        title: 'Agent Training Session',
        description: 'Conduct security awareness training for new recruits.',
        priority: 'low',
        status: 'pending',
        dueDate: '2025-01-30',
        createdAt: '2025-01-12T11:00:00Z',
        tags: ['training', 'hr'],
        category: 'Training',
        recursion: 'Bi-weekly',
    },
];

// Helper function to format date
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Status Card Component
const StatusCard = ({
    title,
    count,
    icon: Icon,
    color,
    trend,
    isDark
}: {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
    trend?: number;
    isDark: boolean;
}) => {
    const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        cyan: {
            bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-100/80',
            border: 'border-cyan-400/40',
            text: isDark ? 'text-cyan-400' : 'text-cyan-600',
            glow: 'shadow-cyan-500/20'
        },
        green: {
            bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-100/80',
            border: 'border-emerald-400/40',
            text: isDark ? 'text-emerald-400' : 'text-emerald-600',
            glow: 'shadow-emerald-500/20'
        },
        orange: {
            bg: isDark ? 'bg-orange-500/10' : 'bg-orange-100/80',
            border: 'border-orange-400/40',
            text: isDark ? 'text-orange-400' : 'text-orange-600',
            glow: 'shadow-orange-500/20'
        },
        purple: {
            bg: isDark ? 'bg-purple-500/10' : 'bg-purple-100/80',
            border: 'border-purple-400/40',
            text: isDark ? 'text-purple-400' : 'text-purple-600',
            glow: 'shadow-purple-500/20'
        },
    };

    const classes = colorClasses[color] || colorClasses.cyan;

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative p-5 rounded-2xl backdrop-blur-xl border ${classes.bg} ${classes.border} 
                       shadow-lg ${classes.glow} transition-all duration-300`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
                    <p className={`text-3xl font-bold mt-1 ${classes.text}`}>{count}</p>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                            <span>{Math.abs(trend)}% from last week</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${classes.bg} ${classes.border} border`}>
                    <Icon className={`w-6 h-6 ${classes.text}`} />
                </div>
            </div>
        </motion.div>
    );
};

// Mini Chart Component
const MiniChart = ({ data, color, isDark }: { data: number[]; color: string; isDark: boolean }) => {
    const max = Math.max(...data);
    const colorMap: Record<string, string> = {
        cyan: isDark ? '#22d3ee' : '#0891b2',
        green: isDark ? '#34d399' : '#059669',
        orange: isDark ? '#fb923c' : '#ea580c',
        purple: isDark ? '#a78bfa' : '#7c3aed',
    };
    const barColor = colorMap[color] || colorMap.cyan;

    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((value, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / max) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex-1 rounded-t-sm"
                    style={{ backgroundColor: barColor, opacity: 0.3 + (i / data.length) * 0.7 }}
                />
            ))}
        </div>
    );
};

// MissionCard Component with ice colors
const MissionCard = ({
    mission,
    onEdit,
    onDelete,
    isDark
}: {
    mission: Mission;
    onEdit: (m: Mission) => void;
    onDelete: (id: string) => void;
    isDark: boolean;
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const priorityColors = {
        critical: isDark ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-red-100 text-red-600 border-red-300',
        high: isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-orange-100 text-orange-600 border-orange-300',
        medium: isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-yellow-100 text-yellow-600 border-yellow-300',
        low: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-blue-100 text-blue-600 border-blue-300',
    };

    const statusColors = {
        pending: isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-200 text-gray-600',
        active: isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600',
        completed: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
        failed: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            className={`relative backdrop-blur-xl border rounded-xl p-5 m-2 transition-all duration-300 shadow-lg
                ${isDark
                    ? 'bg-slate-800/40 border-cyan-500/20 hover:border-cyan-400/40 shadow-cyan-500/5'
                    : 'bg-white/60 border-sky-200/60 hover:border-sky-300/80 shadow-sky-500/10'
                }`}
        >
            {/* Priority Badge */}
            <div className="absolute -top-2 -right-2">
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${priorityColors[mission.priority]}`}>
                    {mission.priority}
                </span>
            </div>

            {/* Menu Button */}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`absolute top-3 right-3 p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {showMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-10 right-3 border rounded-lg shadow-xl z-10
                            ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                    >
                        <button
                            onClick={() => { onEdit(mission); setShowMenu(false); }}
                            className={`flex items-center gap-2 px-4 py-2 text-sm w-full
                                ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                            onClick={() => { onDelete(mission.id); setShowMenu(false); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Badge */}
            <div className="mb-3">
                <span className={`px-2 py-1 text-xs font-semibold uppercase rounded ${statusColors[mission.status]}`}>
                    {mission.status}
                </span>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-bold mb-2 pr-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>{mission.title}</h3>

            {/* Description */}
            <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{mission.description}</p>

            {/* Details Grid */}
            <div className={`grid grid-cols-2 gap-3 text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span>Due: {formatDate(mission.dueDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span>Created: {formatDate(mission.createdAt)}</span>
                </div>
                {mission.recursion && (
                    <div className="flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span>Recurs: {mission.recursion}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <span>{mission.category}</span>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
                {mission.tags.map((tag, index) => (
                    <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-md border
                            ${isDark ? 'bg-gray-700/50 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                        #{tag}
                    </span>
                ))}
            </div>
        </motion.div>
    );
};

// AddMissionModal Component
const AddMissionModal = ({
    isOpen,
    onClose,
    onAdd,
    isDark
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (mission: Omit<Mission, 'id' | 'createdAt'>) => void;
    isDark: boolean;
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium' as Mission['priority'],
        status: 'pending' as Mission['status'],
        dueDate: '',
        category: '',
        tags: '',
        recursion: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        onAdd({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            status: formData.status,
            dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
            category: formData.category || 'General',
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            recursion: formData.recursion || undefined,
        });

        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            status: 'pending',
            dueDate: '',
            category: '',
            tags: '',
            recursion: '',
        });
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto
                    ${isDark ? 'bg-gray-900 border-cyan-500/50' : 'bg-white border-sky-300'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>Initialize New Mission</h2>
                    <button onClick={onClose} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Mission Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400 transition-colors
                                ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            placeholder="Enter mission title..."
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400 transition-colors resize-none
                                ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            rows={3}
                            placeholder="Mission details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Mission['priority'] })}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Mission['status'] })}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Recursion</label>
                            <select
                                value={formData.recursion}
                                onChange={(e) => setFormData({ ...formData, recursion: e.target.value })}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            >
                                <option value="">None</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Bi-weekly">Bi-weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Category</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            placeholder="e.g., Infrastructure, Operations..."
                        />
                    </div>

                    <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Tags (comma separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400
                                ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                            placeholder="security, urgent, backend..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg
                                 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Initialize Mission
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

// Main Dashboard Component
export default function Dashboard() {
    const [missions, setMissions] = useState<Mission[]>(mockMissions);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        // Initialize from localStorage or default to true
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return saved ? saved === 'dark' : true;
        }
        return true;
    });

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    // Stats for cards
    const stats = {
        total: missions.length,
        active: missions.filter(m => m.status === 'active').length,
        completed: missions.filter(m => m.status === 'completed').length,
        pending: missions.filter(m => m.status === 'pending').length,
    };

    // Chart data (mock weekly data)
    const chartData = {
        completed: [3, 5, 4, 7, 6, 8, 5],
        active: [2, 3, 4, 2, 5, 3, 4],
        pending: [4, 3, 5, 4, 3, 4, 6],
    };

    // Mission tabs with dynamic counts
    const missionTabs: MissionTab[] = [
        { id: 'all', label: 'All Missions', icon: <Target className="w-5 h-5" />, count: missions.length },
        { id: 'active', label: 'Active', icon: <Clock className="w-5 h-5" />, count: stats.active },
        { id: 'pending', label: 'Pending', icon: <AlertTriangle className="w-5 h-5" />, count: stats.pending },
        { id: 'completed', label: 'Completed', icon: <CheckCircle className="w-5 h-5" />, count: stats.completed },
        { id: 'starred', label: 'Priority', icon: <Star className="w-5 h-5" />, count: missions.filter(m => m.priority === 'critical' || m.priority === 'high').length },
    ];

    // Filter missions
    const filteredMissions = missions.filter((mission) => {
        if (activeTab !== 'all') {
            if (activeTab === 'starred') {
                if (mission.priority !== 'critical' && mission.priority !== 'high') return false;
            } else if (mission.status !== activeTab) {
                return false;
            }
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                mission.title.toLowerCase().includes(query) ||
                mission.description.toLowerCase().includes(query) ||
                mission.tags.some(tag => tag.toLowerCase().includes(query)) ||
                mission.category.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }
        if (selectedPriority !== 'all' && mission.priority !== selectedPriority) return false;
        if (selectedStatus !== 'all' && mission.status !== selectedStatus) return false;
        return true;
    });

    // Add new mission
    const handleAddMission = useCallback((missionData: Omit<Mission, 'id' | 'createdAt'>) => {
        const newMission: Mission = {
            ...missionData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        setMissions(prev => [newMission, ...prev]);
        setShowAddModal(false);
    }, []);

    // Delete mission
    const handleDeleteMission = useCallback((id: string) => {
        setMissions(prev => prev.filter(m => m.id !== id));
    }, []);

    // Edit mission
    const handleEditMission = useCallback((mission: Mission) => {
        console.log('Edit mission:', mission);
    }, []);

    // Voice command handler - FIXED to properly add tasks
    const handleVoiceCommand = useCallback((command: string): boolean => {
        const lowerCommand = command.toLowerCase().trim();
        console.log('Voice command received:', lowerCommand);

        // Add task patterns - improved matching
        const addPatterns = [
            /^add\s+(.+)/i,
            /^create\s+(.+)/i,
            /^new\s+(?:task|mission)?\s*(.+)/i,
            /^make\s+(.+)/i,
        ];

        for (const pattern of addPatterns) {
            const match = lowerCommand.match(pattern);
            if (match) {
                let title = match[1].trim();
                // Remove common words
                title = title.replace(/^(a\s+)?(task|mission)\s+(called|named|titled)?\s*/i, '').trim();
                if (!title) title = command;

                console.log('Adding mission with title:', title);
                handleAddMission({
                    title: title.charAt(0).toUpperCase() + title.slice(1),
                    description: 'Created via voice command',
                    priority: 'medium',
                    status: 'pending',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    category: 'Voice Created',
                    tags: ['voice'],
                });
                return true;
            }
        }

        // Filter patterns
        if (lowerCommand.includes('show') || lowerCommand.includes('filter')) {
            if (lowerCommand.includes('all')) {
                setActiveTab('all');
                setSelectedPriority('all');
                setSelectedStatus('all');
                return true;
            }
            if (lowerCommand.includes('active')) { setActiveTab('active'); return true; }
            if (lowerCommand.includes('pending')) { setActiveTab('pending'); return true; }
            if (lowerCommand.includes('completed') || lowerCommand.includes('done')) { setActiveTab('completed'); return true; }
            if (lowerCommand.includes('critical') || lowerCommand.includes('high priority')) { setSelectedPriority('critical'); return true; }
        }

        return false;
    }, [handleAddMission]);

    // State for charts modal
    const [showChartsModal, setShowChartsModal] = useState(false);

    // Pre-defined particle data (static to avoid impure function calls during render)
    const particleData = [
        { id: 0, initialX: 100, initialY: 50, animateY: -150, duration: 8, delay: 0.5 },
        { id: 1, initialX: 200, initialY: 150, animateY: -180, duration: 10, delay: 1 },
        { id: 2, initialX: 350, initialY: 80, animateY: -120, duration: 7, delay: 2 },
        { id: 3, initialX: 500, initialY: 200, animateY: -200, duration: 12, delay: 0 },
        { id: 4, initialX: 650, initialY: 120, animateY: -160, duration: 9, delay: 3 },
        { id: 5, initialX: 800, initialY: 60, animateY: -140, duration: 11, delay: 1.5 },
        { id: 6, initialX: 900, initialY: 180, animateY: -190, duration: 8, delay: 2.5 },
        { id: 7, initialX: 150, initialY: 300, animateY: -170, duration: 10, delay: 4 },
        { id: 8, initialX: 400, initialY: 350, animateY: -130, duration: 6, delay: 0.8 },
        { id: 9, initialX: 600, initialY: 400, animateY: -210, duration: 13, delay: 1.2 },
        { id: 10, initialX: 750, initialY: 280, animateY: -145, duration: 9, delay: 3.5 },
        { id: 11, initialX: 50, initialY: 450, animateY: -185, duration: 11, delay: 2.2 },
        { id: 12, initialX: 300, initialY: 500, animateY: -155, duration: 7, delay: 4.5 },
        { id: 13, initialX: 550, initialY: 550, animateY: -175, duration: 10, delay: 0.3 },
        { id: 14, initialX: 850, initialY: 480, animateY: -195, duration: 8, delay: 1.8 },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-gray-950 text-white' : 'bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 text-gray-900'}`}>

            {/* Enhanced Framer Motion Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Animated gradient orbs */}
                <motion.div
                    animate={{
                        x: [0, 100, -50, 0],
                        y: [0, -100, 50, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-300/30'}`}
                />
                <motion.div
                    animate={{
                        x: [0, -100, 80, 0],
                        y: [0, 50, -100, 0],
                        scale: [1, 0.8, 1.1, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -top-20 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-300/30'}`}
                />
                <motion.div
                    animate={{
                        x: [0, 80, -80, 0],
                        y: [0, -50, 100, 0],
                        scale: [1, 1.1, 0.9, 1],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -bottom-40 left-1/4 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-blue-500/15' : 'bg-blue-300/30'}`}
                />
                <motion.div
                    animate={{
                        x: [0, -60, 60, 0],
                        y: [0, 80, -80, 0],
                        scale: [1, 0.9, 1.2, 1],
                    }}
                    transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-300/30'}`}
                />

                {/* Floating particles */}
                {particleData.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: particle.initialX,
                            y: particle.initialY,
                        }}
                        animate={{
                            y: [null, particle.animateY],
                            opacity: [0, 0.6, 0],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                        }}
                        className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-purple-400'}`}
                    />
                ))}
            </div>

            {/* Particles Background for dark mode */}
            {isDark && <ParticlesBackground />}

            <div className="relative z-10 flex">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobile && sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`${isMobile ? 'fixed z-50' : 'relative'} w-72 backdrop-blur-xl border-r flex flex-col h-screen
                                ${isDark ? 'bg-gray-900/80 border-cyan-500/30' : 'bg-white/80 border-sky-200'}`}
                        >
                            {/* Sidebar Header */}
                            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <h1 className={`text-xl font-bold ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500' : 'text-cyan-600'}`}>
                                        <Target className="inline w-5 h-5 mr-2" />
                                        Mission Control
                                    </h1>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className={`p-2 transition-colors ${isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Mission Tabs */}
                            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                {missionTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                            ? isDark
                                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                                : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                                            : isDark
                                                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {tab.icon}
                                            <span className="font-medium">{tab.label}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id
                                            ? isDark ? 'bg-cyan-500/30' : 'bg-cyan-200'
                                            : isDark ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </nav>

                            {/* Stats */}
                            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`rounded-lg p-3 text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                        <p className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{missions.length}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                                    </div>
                                    <div className={`rounded-lg p-3 text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                        <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Done</p>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    {/* Top Bar */}
                    <header className={`backdrop-blur-xl border-b px-4 md:px-6 py-4
                        ${isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-white/60 border-gray-200'}`}>
                        <div className="flex items-center justify-between gap-4">
                            {/* Menu Toggle */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`p-2 transition-colors ${isDark ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-xl relative">
                                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search missions..."
                                    className={`w-full border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-1 transition-all duration-200
                                        ${isDark
                                            ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50'
                                            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500/50'}`}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                {/* Theme Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleTheme}
                                    className={`p-3 rounded-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </motion.button>

                                {/* Charts Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowChartsModal(true)}
                                    className={`p-3 rounded-lg transition-all ${isDark ? 'bg-gray-800 text-purple-400 hover:bg-gray-700' : 'bg-gray-100 text-purple-500 hover:bg-gray-200'}`}
                                    title="View Analytics"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                </motion.button>

                                {/* Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-3 rounded-lg transition-all ${showFilters
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>

                                {/* Voice Command */}
                                <VoiceCommandButton onCommand={handleVoiceCommand} />

                                {/* Add Mission */}
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 
                                             text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500
                                             transition-all duration-200 shadow-lg shadow-cyan-500/25"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">New Mission</span>
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={`mt-4 pt-4 border-t overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                >
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Priority:</label>
                                            <select
                                                value={selectedPriority}
                                                onChange={(e) => setSelectedPriority(e.target.value)}
                                                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400
                                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                            >
                                                <option value="all">All</option>
                                                <option value="critical">Critical</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status:</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400
                                                    ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                            >
                                                <option value="all">All</option>
                                                <option value="pending">Pending</option>
                                                <option value="active">Active</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedPriority('all');
                                                setSelectedStatus('all');
                                                setSearchQuery('');
                                            }}
                                            className={`text-sm transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </header>

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatusCard
                                title="Total Missions"
                                count={stats.total}
                                icon={Target}
                                color="cyan"
                                trend={12}
                                isDark={isDark}
                            />
                            <StatusCard
                                title="Active"
                                count={stats.active}
                                icon={Activity}
                                color="orange"
                                trend={8}
                                isDark={isDark}
                            />
                            <StatusCard
                                title="Completed"
                                count={stats.completed}
                                icon={CheckCircle}
                                color="green"
                                trend={25}
                                isDark={isDark}
                            />
                            <StatusCard
                                title="Pending"
                                count={stats.pending}
                                icon={Clock}
                                color="purple"
                                trend={-5}
                                isDark={isDark}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 p-4 rounded-2xl backdrop-blur-xl border
                            ${isDark ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white/60 border-gray-200'}`}>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <BarChart3 className="inline w-4 h-4 mr-2" />
                                        Completed
                                    </h3>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</span>
                                </div>
                                <MiniChart data={chartData.completed} color="green" isDark={isDark} />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Zap className="inline w-4 h-4 mr-2" />
                                        Active
                                    </h3>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</span>
                                </div>
                                <MiniChart data={chartData.active} color="orange" isDark={isDark} />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Clock className="inline w-4 h-4 mr-2" />
                                        Pending
                                    </h3>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</span>
                                </div>
                                <MiniChart data={chartData.pending} color="purple" isDark={isDark} />
                            </div>
                        </div>

                        {/* Mission Grid */}
                        {filteredMissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Target className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No Missions Found</h3>
                                <p className={`mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {missions.length === 0
                                        ? "No missions have been added yet. Click 'New Mission' to get started!"
                                        : "Try adjusting your filters or search query"}
                                </p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all
                                        ${isDark
                                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30'
                                            : 'bg-cyan-100 text-cyan-600 border-cyan-300 hover:bg-cyan-200'}`}
                                >
                                    <Plus className="w-5 h-5" />
                                    Initialize First Mission
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {filteredMissions.map((mission) => (
                                        <MissionCard
                                            key={mission.id}
                                            mission={mission}
                                            onEdit={handleEditMission}
                                            onDelete={handleDeleteMission}
                                            isDark={isDark}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Mission Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddMissionModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAddMission}
                        isDark={isDark}
                    />
                )}
            </AnimatePresence>

            {/* Charts Analytics Modal */}
            <AnimatePresence>
                {showChartsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowChartsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl
                                ${isDark ? 'bg-gray-900 border-purple-500/30' : 'bg-white border-purple-200'}`}
                        >
                            {/* Header */}
                            <div className={`sticky top-0 flex items-center justify-between p-6 border-b backdrop-blur-xl z-10
                                ${isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                                        <BarChart3 className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                    </div>
                                    <div>
                                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Analytics Dashboard</h2>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mission Performance Overview</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowChartsModal(false)}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Charts Content */}
                            <div className="p-6 space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'}`}>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{stats.total}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                                    </div>
                                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.active}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                                    </div>
                                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                                    </div>
                                    <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                                        <p className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{stats.pending}</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                                    </div>
                                </div>

                                {/* Chart Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                            <CheckCircle className="w-5 h-5" /> Completed Tasks
                                        </h3>
                                        <div className="h-32">
                                            <MiniChart data={chartData.completed} color="green" isDark={isDark} />
                                        </div>
                                        <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</p>
                                    </div>
                                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                            <Activity className="w-5 h-5" /> Active Tasks
                                        </h3>
                                        <div className="h-32">
                                            <MiniChart data={chartData.active} color="orange" isDark={isDark} />
                                        </div>
                                        <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</p>
                                    </div>
                                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                            <Clock className="w-5 h-5" /> Pending Tasks
                                        </h3>
                                        <div className="h-32">
                                            <MiniChart data={chartData.pending} color="purple" isDark={isDark} />
                                        </div>
                                        <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 days</p>
                                    </div>
                                </div>

                                {/* Priority Distribution */}
                                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority Distribution</h3>
                                    <div className="flex items-center gap-4">
                                        {['critical', 'high', 'medium', 'low'].map((priority) => {
                                            const count = missions.filter(m => m.priority === priority).length;
                                            const percentage = missions.length > 0 ? (count / missions.length) * 100 : 0;
                                            const colors: Record<string, string> = {
                                                critical: isDark ? 'bg-red-500' : 'bg-red-400',
                                                high: isDark ? 'bg-orange-500' : 'bg-orange-400',
                                                medium: isDark ? 'bg-yellow-500' : 'bg-yellow-400',
                                                low: isDark ? 'bg-blue-500' : 'bg-blue-400',
                                            };
                                            return (
                                                <div key={priority} className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{priority}</span>
                                                        <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                                                    </div>
                                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.8, delay: 0.2 }}
                                                            className={`h-full rounded-full ${colors[priority]}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
