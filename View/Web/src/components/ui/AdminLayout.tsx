import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const [hoveredTab, setHoveredTab] = React.useState<NavTab | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab from current path if not provided
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

                {/* Right: Notification & Profile */}
                <div style={styles.headerRight}>
                    <button
                        style={styles.iconButton}
                        title="Notifications"
                    >
                        🔔
                    </button>
                    <button
                        style={styles.iconButton}
                        title="Admin Profile"
                    >
                        👤
                    </button>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.container}>
                    {title && <h2 style={styles.title}>{title}</h2>}
                    {children}
                </div>
            </main>
        </div >
    );
};

export default AdminLayout;
