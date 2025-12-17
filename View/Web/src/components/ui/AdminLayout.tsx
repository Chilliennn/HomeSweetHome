import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAdminNotifications, type AdminNotification } from '@home-sweet-home/model';
import { adminViewModel, safetyViewModel, consultationViewModel } from '@home-sweet-home/viewmodel';

type NavTab = 'relationship' | 'application' | 'reports' | 'keyword';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    activeTab?: NavTab;
    onTabChange?: (tab: NavTab) => void;
}

const styles = {
    layout: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: '#f5f5f5',
        width: '100%',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 1.5rem',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #9DE2D0',
        width: '100%',
        boxSizing: 'border-box' as const,
        height: '64px',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
    },
    logo: {
        margin: 0,
        fontSize: '1.25rem',
        color: '#9DE2D0',
        letterSpacing: '1.5px',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
    },
    headerCenter: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    navTab: {
        padding: '0.75rem 1.25rem',
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#666',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    navTabActive: {
        backgroundColor: '#9DE2D0',
        color: '#ffffff',
    },
    navTabHover: {
        backgroundColor: '#f0f0f0',
    },
    navSeparator: {
        color: '#ccc',
        margin: '0 0.25rem',
        fontSize: '0.9rem',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        position: 'relative' as const,
    },
    iconButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.25rem',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        position: 'relative' as const,
    },
    notificationBadge: {
        position: 'absolute' as const,
        top: '4px',
        right: '4px',
        background: '#EB8F80',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdown: {
        position: 'absolute' as const,
        top: '100%',
        right: 0,
        marginTop: '8px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        minWidth: '300px',
        zIndex: 1000,
        overflow: 'hidden',
    },
    dropdownHeader: {
        padding: '16px',
        borderBottom: '1px solid #eee',
        fontWeight: 700,
        fontSize: '14px',
        color: '#333',
    },
    dropdownItem: {
        padding: '12px 16px',
        borderBottom: '1px solid #f5f5f5',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    dropdownItemHover: {
        background: '#f9f9f9',
    },
    notificationItem: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
    },
    notificationContent: {
        flex: 1,
    },
    notificationMessage: {
        fontSize: '13px',
        color: '#333',
        margin: 0,
        lineHeight: 1.4,
    },
    notificationTime: {
        fontSize: '11px',
        color: '#999',
        marginTop: '4px',
    },
    unreadDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#9DE2D0',
        marginTop: '6px',
    },
    profileDropdown: {
        minWidth: '220px',
    },
    profileHeader: {
        padding: '20px 16px',
        borderBottom: '1px solid #eee',
        textAlign: 'center' as const,
    },
    profileAvatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #9DE2D0 0%, #C8ADD6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        margin: '0 auto 12px',
    },
    profileName: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#333',
        margin: 0,
    },
    profileId: {
        fontSize: '12px',
        color: '#999',
        marginTop: '4px',
    },
    logoutButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '14px 16px',
        background: 'transparent',
        border: 'none',
        fontSize: '14px',
        fontWeight: 600,
        color: '#EB8F80',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    main: {
        flex: 1,
        padding: '1.5rem',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
    },
    title: {
        marginTop: 0,
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        color: '#333',
    },
};

const navTabs: { key: NavTab; label: string; icon: string; path: string }[] = [
    { key: 'relationship', label: 'Relationship', icon: '👨‍👩‍👦', path: '/admin/relationships' },
    { key: 'application', label: 'Application', icon: '📋', path: '/admin' },
    { key: 'reports', label: 'Reports', icon: '📊', path: '/admin/reports' },
    { key: 'keyword', label: 'Keyword Management', icon: '🔑', path: '/admin/keywords' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    title,
    activeTab,
    onTabChange,
}) => {
    const [hoveredTab, setHoveredTab] = useState<NavTab | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [adminId, setAdminId] = useState('');
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Get admin info from localStorage and fetch notifications
    useEffect(() => {
        const name = localStorage.getItem('adminName') || 'Admin';
        const id = localStorage.getItem('adminId') || 'admin001';
        setAdminName(name);
        setAdminId(id);

        // Fetch real notifications
        getAdminNotifications(10).then(setNotifications).catch(console.error);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentTab = activeTab || navTabs.find(tab => location.pathname === tab.path)?.key || 'application';

    const getTabStyle = (tab: NavTab): React.CSSProperties => {
        const isActive = currentTab === tab;
        const isHovered = hoveredTab === tab && !isActive;
        return {
            ...styles.navTab,
            ...(isActive ? styles.navTabActive : {}),
            ...(isHovered ? styles.navTabHover : {}),
        };
    };

    const handleTabClick = (tab: NavTab, path: string) => {
        if (onTabChange) {
            onTabChange(tab);
        }
        navigate(path);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        navigate('/');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} min ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const handleNotificationClick = async (notification: AdminNotification) => {
        setShowNotifications(false);

        // Remove this notification from the list (mark as read/handled)
        setNotifications(prev => prev.filter(n => n.id !== notification.id));

        try {
            switch (notification.type) {
                case 'application':
                    // Navigate to admin page and select the application
                    if (notification.reference_id) {
                        await adminViewModel.selectApplication(notification.reference_id);
                    }
                    navigate('/admin');
                    break;
                case 'safety_alert':
                    // Navigate to reports and select the alert
                    if (notification.reference_id) {
                        await safetyViewModel.selectAlert(notification.reference_id);
                    }
                    navigate('/admin/reports');
                    break;
                case 'consultation':
                    // Navigate to reports page and select the consultation
                    if (notification.reference_id) {
                        await consultationViewModel.selectConsultation(notification.reference_id);
                    }
                    navigate('/admin/reports');
                    break;
                default:
                    navigate('/admin');
            }
        } catch (error) {
            console.error('Error handling notification:', error);
            // Still navigate even if selection fails
            if (notification.type === 'application') {
                navigate('/admin');
            } else {
                navigate('/admin/reports');
            }
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'application': return { icon: '📋', bg: '#D4E5AE' };
            case 'safety_alert': return { icon: '⚠️', bg: '#EB8F80' };
            case 'consultation': return { icon: '👨‍👩‍👧', bg: '#9DE2D0' };
            case 'relationship': return { icon: '💕', bg: '#C8ADD6' };
            default: return { icon: '🔔', bg: '#FADE9F' };
        }
    };

    return (
        <div style={styles.layout}>
            <header style={styles.header}>
                {/* Left: Logo */}
                <div style={styles.headerLeft}>
                    <h1 style={styles.logo} onClick={() => navigate('/admin')}>HOMESWEETHOME</h1>
                </div>

                {/* Center: Navigation Tabs */}
                <nav style={styles.headerCenter}>
                    {navTabs.map((tab, index) => (
                        <React.Fragment key={tab.key}>
                            <button
                                style={getTabStyle(tab.key)}
                                onClick={() => handleTabClick(tab.key, tab.path)}
                                onMouseEnter={() => setHoveredTab(tab.key)}
                                onMouseLeave={() => setHoveredTab(null)}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                            {index < navTabs.length - 1 && (
                                <span style={styles.navSeparator}> </span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Right: Notification & Profile Dropdowns */}
                <div style={styles.headerRight}>
                    {/* Notification Dropdown */}
                    <div ref={notificationRef} style={{ position: 'relative' }}>
                        <button
                            style={styles.iconButton}
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                            title="Notifications"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={styles.notificationBadge}>{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div style={styles.dropdown}>
                                <div style={styles.dropdownHeader}>
                                    Notifications ({unreadCount} unread)
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(notification => {
                                        const iconStyle = getNotificationIcon(notification.type);
                                        return (
                                            <div
                                                key={notification.id}
                                                style={{ ...styles.dropdownItem, cursor: 'pointer' }}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div style={styles.notificationItem}>
                                                    <div style={{ ...styles.notificationIcon, background: iconStyle.bg }}>
                                                        {iconStyle.icon}
                                                    </div>
                                                    <div style={styles.notificationContent}>
                                                        <p style={styles.notificationMessage}>{notification.message}</p>
                                                        <div style={styles.notificationTime}>{formatTimeAgo(notification.created_at)}</div>
                                                    </div>
                                                    {!notification.is_read && <div style={styles.unreadDot} />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div ref={profileRef} style={{ position: 'relative' }}>
                        <button
                            style={styles.iconButton}
                            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                            title="Admin Profile"
                        >
                            👤
                        </button>
                        {showProfile && (
                            <div style={{ ...styles.dropdown, ...styles.profileDropdown }}>
                                <div style={styles.profileHeader}>
                                    <div style={styles.profileAvatar}>👤</div>
                                    <p style={styles.profileName}>{adminName}</p>
                                    <div style={styles.profileId}>ID: {adminId}</div>
                                </div>
                                <button
                                    style={styles.logoutButton}
                                    onClick={handleLogout}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.container}>
                    {title && <h2 style={styles.title}>{title}</h2>}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

