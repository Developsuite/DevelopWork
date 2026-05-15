import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveModules } from '../../store/slices/accessSlice';
import {
    ChevronLeft,
    ChevronRight,
    Briefcase,
    GraduationCap,
    Heart,
    Globe,
    Crown,
    Users,
    UserCheck,
    Laptop,
    Building2,
    TrendingUp,
    Shield,
    FolderKanban,
    DollarSign,
    Handshake,
    Headphones,
    FileText,
    BarChart3,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import './Onboarding.css';

const STEPS = [
    {
        id: 'purpose',
        title: 'Hey there, what brings you here today?',
        subtitle: 'This helps us personalize your experience',
        options: [
            { key: 'work', label: 'Work', icon: Briefcase },
            { key: 'personal', label: 'Personal', icon: Heart },
            { key: 'school', label: 'School', icon: GraduationCap },
            { key: 'nonprofits', label: 'Nonprofits', icon: Globe },
        ],
        multiple: false,
        bgColor: '#6C5CE7',
        bgGradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
    },
    {
        id: 'role',
        title: 'What best describes your current role?',
        subtitle: 'Select the role that fits you best',
        options: [
            { key: 'business_owner', label: 'Business Owner', icon: Crown },
            { key: 'team_leader', label: 'Team Leader', icon: Shield },
            { key: 'team_member', label: 'Team Member', icon: UserCheck },
            { key: 'freelancer', label: 'Freelancer', icon: Laptop },
            { key: 'director', label: 'Director', icon: Building2 },
            { key: 'c_level', label: 'C-Level', icon: TrendingUp },
            { key: 'vp', label: 'VP', icon: BarChart3 },
        ],
        multiple: false,
        bgColor: '#6C5CE7',
        bgGradient: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
    },
    {
        id: 'team_size',
        title: 'How many people are on your team?',
        subtitle: null,
        options: [
            { key: '1', label: 'Only me' },
            { key: '2-5', label: '2-5' },
            { key: '6-10', label: '6-10' },
            { key: '11-15', label: '11-15' },
            { key: '16-25', label: '16-25' },
            { key: '26-50', label: '26-50' },
            { key: '51-100', label: '51-100' },
            { key: '101-500', label: '101-500' },
        ],
        extraQuestion: {
            title: 'How many people work at your company?',
            options: [
                { key: 'c_1-19', label: '1-19' },
                { key: 'c_20-49', label: '20-49' },
                { key: 'c_50-99', label: '50-99' },
                { key: 'c_100-250', label: '100-250' },
                { key: 'c_251-500', label: '251-500' },
                { key: 'c_501-1500', label: '501-1500' },
                { key: 'c_1500+', label: '1500+' },
            ],
        },
        multiple: false,
        bgColor: '#00B894',
        bgGradient: 'linear-gradient(135deg, #00B894 0%, #55EFC4 100%)',
    },
    {
        id: 'modules',
        title: "Select what you'd like to focus on first",
        subtitle: 'Help us tailor the best experience for you',
        options: [
            { key: 'projects', label: 'Project Management', icon: FolderKanban },
            { key: 'hr', label: 'Human Resources', icon: Users },
            { key: 'finance', label: 'Finance & Budgets', icon: DollarSign },
            { key: 'leads', label: 'CRM & Leads', icon: Handshake },
            { key: 'support', label: 'Customer Support', icon: Headphones },
            { key: 'docs', label: 'Documentation', icon: FileText },
        ],
        multiple: true,
        bgColor: '#FDCB6E',
        bgGradient: 'linear-gradient(135deg, #FDCB6E 0%, #F39C12 100%)',
    },
];

const Onboarding = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState({
        purpose: null,
        role: null,
        team_size: null,
        company_size: null,
        modules: [],
    });

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const handleSelect = (key) => {
        if (step.multiple) {
            setSelections((prev) => {
                const arr = prev[step.id] || [];
                if (arr.includes(key)) {
                    return { ...prev, [step.id]: arr.filter((k) => k !== key) };
                }
                return { ...prev, [step.id]: [...arr, key] };
            });
        } else {
            setSelections((prev) => ({
                ...prev,
                [step.id]: prev[step.id] === key ? null : key,
            }));
        }
    };

    const handleExtraSelect = (key) => {
        setSelections((prev) => ({
            ...prev,
            company_size: prev.company_size === key ? null : key,
        }));
    };

    const canContinue = () => {
        if (step.multiple) {
            return (selections[step.id] || []).length > 0;
        }
        if (step.extraQuestion) {
            return selections[step.id] && selections.company_size;
        }
        return !!selections[step.id];
    };

    const handleContinue = () => {
        if (!canContinue()) return;
        if (isLastStep) {
            // Save selected modules and go to next step
            const validModules = ['projects', 'hr', 'finance', 'leads', 'support', 'docs'];
            const selectedModules = (selections.modules || []).filter((m) =>
                validModules.includes(m)
            );
            if (selectedModules.length > 0) {
                dispatch(setActiveModules(selectedModules));
            }
            
            // If user isn't logged in, send them to register with their onboarding info
            // In a real app, you'd pass this state to register
            navigate(user ? '/modules' : '/register');
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const isSelected = (key) => {
        if (step.multiple) {
            return (selections[step.id] || []).includes(key);
        }
        return selections[step.id] === key;
    };

    return (
        <div className="onboarding">
            {/* Left Panel — Form */}
            <div className="onboarding__left">
                {/* Logo */}
                <div className="onboarding__logo">
                    <span className="onboarding__logo-icon">
                        <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </span>
                    DevelopWork
                </div>

                {/* Step Content */}
                <div className="onboarding__content" key={currentStep}>
                    <h1 className="onboarding__title">{step.title}</h1>
                    {step.subtitle && (
                        <p className="onboarding__subtitle">{step.subtitle}</p>
                    )}

                    {/* Options */}
                    <div className="onboarding__options">
                        {step.options.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.key}
                                    className={`onboarding__chip ${isSelected(option.key) ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option.key)}
                                >
                                    {Icon && <Icon size={16} />}
                                    {option.label}
                                    {isSelected(option.key) && (
                                        <CheckCircle2 size={14} className="onboarding__chip-check" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Extra Question (team size step) */}
                    {step.extraQuestion && (
                        <div className="onboarding__extra">
                            <h2 className="onboarding__extra-title">{step.extraQuestion.title}</h2>
                            <div className="onboarding__options">
                                {step.extraQuestion.options.map((option) => (
                                    <button
                                        key={option.key}
                                        className={`onboarding__chip ${selections.company_size === option.key ? 'selected' : ''}`}
                                        onClick={() => handleExtraSelect(option.key)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="onboarding__footer">
                    {!isFirstStep ? (
                        <button className="onboarding__back-btn" onClick={handleBack}>
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="onboarding__footer-right">
                        {/* Step Indicator */}
                        <div className="onboarding__steps">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`onboarding__step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
                                />
                            ))}
                        </div>

                        <button
                            className={`onboarding__continue-btn ${!canContinue() ? 'disabled' : ''}`}
                            onClick={handleContinue}
                            disabled={!canContinue()}
                        >
                            {isLastStep ? (
                                <>
                                    <Sparkles size={16} />
                                    Get Started
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel — Illustration/Visual */}
            <div
                className="onboarding__right"
                style={{ background: step.bgGradient }}
            >
                <div className="onboarding__visual">
                    {/* Floating Decorative Elements */}
                    <div className="onboarding__deco onboarding__deco--1" />
                    <div className="onboarding__deco onboarding__deco--2" />
                    <div className="onboarding__deco onboarding__deco--3" />

                    {/* Central Visual Card */}
                    <div className="onboarding__visual-card">
                        <div className="onboarding__visual-header">
                            <div className="onboarding__visual-dots">
                                <span /><span /><span />
                            </div>
                        </div>
                        <div className="onboarding__visual-body">
                            <div className="onboarding__visual-row">
                                <div className="onboarding__visual-bar" style={{ width: '70%', background: '#00C875' }} />
                                <div className="onboarding__visual-circle" style={{ background: '#FDAB3D' }} />
                            </div>
                            <div className="onboarding__visual-row">
                                <div className="onboarding__visual-bar" style={{ width: '45%', background: '#579BFC' }} />
                                <div className="onboarding__visual-circle" style={{ background: '#A25DDC' }} />
                            </div>
                            <div className="onboarding__visual-row">
                                <div className="onboarding__visual-bar" style={{ width: '85%', background: '#FDAB3D' }} />
                                <div className="onboarding__visual-circle" style={{ background: '#E2445C' }} />
                            </div>
                            <div className="onboarding__visual-row">
                                <div className="onboarding__visual-bar" style={{ width: '55%', background: '#E2445C' }} />
                                <div className="onboarding__visual-circle" style={{ background: '#00C875' }} />
                            </div>
                        </div>
                    </div>

                    {/* Floating Mini Cards */}
                    <div className="onboarding__float-card onboarding__float-card--1">
                        <CheckCircle2 size={18} />
                        <span>All set!</span>
                    </div>
                    <div className="onboarding__float-card onboarding__float-card--2">
                        <Users size={18} />
                        <span>Team</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
