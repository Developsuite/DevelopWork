import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../../store/slices/uiSlice';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.ui.theme);
    const isDark = theme === 'dark';

    return (
        <button
            className="theme-toggle"
            onClick={() => dispatch(toggleTheme())}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <span className="theme-toggle__track" />
            <span className="theme-toggle__thumb">
                <span className="theme-toggle__icon">
                    {isDark ? <Moon size={12} /> : <Sun size={12} />}
                </span>
            </span>
        </button>
    );
};

export default ThemeToggle;
