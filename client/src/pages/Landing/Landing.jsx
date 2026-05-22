import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { 
  FiCheck, 
  FiChevronDown,
  FiZap,
  FiStar
} from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [activeModuleTab, setActiveModuleTab] = useState('client');
  const [activePricePlan, setActivePricePlan] = useState('starter');

  const pricingPlans = {
    starter: { name: 'Starter', price: 'Free Trial', desc: 'Try everything for free. Experience the full power of DevelopWork with no commitment.', features: ['Access to all core features', 'Basic analytics dashboard', 'Up to 5 team members', 'Standard support', '2GB storage'] },
    growth: { name: 'Growth', price: '$79', desc: 'Advanced features for growing businesses that need more power and flexibility.', features: ['Everything in Starter', 'Advanced analytics', 'Unlimited team members', 'Priority support', '50GB storage'] },
    scale: { name: 'Scale', price: '$199', desc: 'Full power for large-scale operations requiring enterprise-grade tools.', features: ['Everything in Growth', 'Custom integrations', 'Dedicated account manager', 'SSO & advanced security', 'Unlimited storage'] }
  };

  return (
    <div className="landing">
      {/* Navbar — Floating Pill */}
      <div className="landing-nav-wrapper">
        <nav className="landing-nav" id="landing-navbar">
          <a href="/" className="landing-nav__logo" id="landing-logo">
            <img src="/images/logo.png" alt="DevelopWork" className="landing-nav__logo-img" />
            <span>DevelopWork</span>
          </a>
          <ul className="landing-nav__links" id="landing-nav-links">
            <li><a href="#how-it-works">About</a></li>
            <li><a href="#performance">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <div className="landing-nav__actions">
            <button
              className="landing-nav__signup"
              id="landing-nav-signup"
              onClick={() => navigate('/onboarding')}
            >
              Sign up
            </button>
            <button
              className="landing-nav__cta"
              id="landing-nav-cta"
              onClick={() => navigate('/login')}
            >
              <span>Sign in</span>
              <span className="landing-nav__cta-arrow">
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="landing-hero" id="landing-hero">
        <video 
          className="landing-hero__video" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="landing-hero__container">
          <div className="landing-hero__main landing-hero__main--centered">
            {/* Left: Heading + CTA */}
            <div className="landing-hero__content" id="landing-hero-content">
              <div className="landing-hero__heading">
                <h1 id="landing-hero-title">
                  <span className="landing-hero__line">Strategy and growth for</span>
                  <span className="landing-hero__line landing-hero__highlight">modern teams</span>
                </h1>
                <p className="landing-hero__subtitle" id="landing-hero-subtitle">
                  DevelopWork partners with startups to streamline operations,
                  elevate team performance, and build a foundation for
                  lasting success.
                </p>
              </div>
              <div className="landing-hero__buttons" id="landing-hero-buttons">
                <button
                  className="landing-btn landing-btn--primary landing-btn--lg"
                  id="hero-get-started"
                  onClick={() => navigate('/onboarding')}
                >
                  <span>Try now</span>
                  <span className="landing-btn__arrow">
                    <ArrowRight size={18} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="landing-trusted" id="landing-trusted">
        <div className="landing-trusted__container">
          <p className="landing-trusted__label">Trusted by leading companies worldwide</p>
          <div className="landing-trusted__logos">
            {['Developsuite', 'Voxprotech', 'Highreach'].map((name) => (
              <div className="landing-trusted__logo" key={name}>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-how" id="how-it-works">
        <div className="landing-how__container">
          <div className="landing-how__wrapper">
            {/* Step 1: Easy setup */}
            <div 
              className={`landing-step ${activeStep === 1 ? 'landing-step--active' : ''}`}
              onClick={() => setActiveStep(1)}
            >
              <div className="landing-step__content">
                <span className="landing-step__number">01</span>
                <div className="landing-step__text">
                  <h3>Easy setup</h3>
                  <p>Create your workspace and invite your team. Get everything ready in minutes.</p>
                </div>
              </div>
              {activeStep === 1 && (
                <div className="landing-step__image">
                  <img src="/images/step1.png" alt="Setup" />
                </div>
              )}
            </div>

            {/* Step 2: Collaborate */}
            <div 
              className={`landing-step ${activeStep === 2 ? 'landing-step--active' : ''}`}
              onClick={() => setActiveStep(2)}
            >
              <div className="landing-step__content">
                <span className="landing-step__number">02</span>
                <div className="landing-step__text">
                  <h3>Collaborate</h3>
                  <p>Assign tasks and keep communication clear. Everyone stays aligned.</p>
                </div>
              </div>
              {activeStep === 2 && (
                <div className="landing-step__image">
                  <img src="/images/step2.png" alt="Collaborate" />
                </div>
              )}
            </div>

            {/* Step 3: Track growth */}
            <div 
              className={`landing-step ${activeStep === 3 ? 'landing-step--active' : ''}`}
              onClick={() => setActiveStep(3)}
            >
              <div className="landing-step__content">
                <span className="landing-step__number">03</span>
                <div className="landing-step__text">
                  <h3>Track growth</h3>
                  <p>Use dashboards to monitor progress, trends, and what matters most.</p>
                </div>
              </div>
              {activeStep === 3 && (
                <div className="landing-step__image">
                  <img src="/images/step3.png" alt="Growth" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Performance / Modules Section */}
      <section className="landing-performance" id="performance">
        <div className="landing-performance__container">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Built for high performance</h2>
            <p className="landing-section-subtitle">
              DevelopWork gives your team everything it needs to stay aligned, 
              track performance, and scale with confidence — all in one place.
            </p>
          </div>

          <div className="landing-performance__content">
            {/* Tabs */}
            <div className="landing-tabs">
              {[
                { id: 'client', label: 'Client portal' },
                { id: 'kpi', label: 'KPI tracking' },
                { id: 'ai', label: 'AI Assistant' },
                { id: 'team', label: 'Team management' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`landing-tab ${activeModuleTab === tab.id ? 'landing-tab--active' : ''}`}
                  onClick={() => setActiveModuleTab(tab.id)}
                >
                  <span className="landing-tab__label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Panel */}
            <div className="landing-panel">
              <div className="landing-panel__visual">
                <img 
                  src={
                    activeModuleTab === 'client' ? '/images/section/4.png' :
                    activeModuleTab === 'kpi' ? '/images/section/3.png' :
                    activeModuleTab === 'ai' ? '/images/section/2.png' :
                    activeModuleTab === 'team' ? '/images/section/1.png' : 
                    '/images/section/4.png'
                  } 
                  alt={activeModuleTab} 
                />
                <div className="landing-panel__overlay"></div>
              </div>
              
              <div className="landing-panel__info">
                <span className="landing-panel__tag">
                  {activeModuleTab === 'client' && 'Client Portal'}
                  {activeModuleTab === 'kpi' && 'KPI Tracking'}
                  {activeModuleTab === 'ai' && 'AI Assistant'}
                  {activeModuleTab === 'team' && 'Team Management'}
                </span>
                
                <h3>
                  {activeModuleTab === 'client' && 'Centralized access for teams and clients'}
                  {activeModuleTab === 'kpi' && 'Real-time performance insights'}
                  {activeModuleTab === 'ai' && 'Intelligent assistance across your system'}
                  {activeModuleTab === 'team' && 'Efficient resource and team allocation'}
                </h3>
                
                <p>
                  {activeModuleTab === 'client' && 'Securely share progress, files, feedback, and timelines with stakeholders. Keep everyone on the same page without switching platforms.'}
                  {activeModuleTab === 'kpi' && 'Monitor business health with customizable dashboards. Track revenue, employee efficiency, and project status in one unified view.'}
                  {activeModuleTab === 'ai' && 'Get instant answers to any question about your projects, team, or finance. Our integrated AI understands your entire workspace to provide helpful insights.'}
                  {activeModuleTab === 'team' && 'Add employees and managers to your system for seamless team handling and efficient resource management.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="landing-testimonials" id="testimonials">
        <div className="landing-testimonials__container">
          <div className="landing-section-header">
            <span className="landing-section-tag">Testimonials</span>
            <h2 className="landing-section-title">Trusted by industry leaders</h2>
            <p className="landing-section-subtitle">See why thousands of teams choose DevelopWork for their daily operations.</p>
          </div>

          <div className="landing-testimonials__grid">
            {[
              {
                text: "DevelopWork transformed our project tracking. The AI assistant is a game-changer for quick insights into our team's performance.",
                author: "Sarah Jenkins",
                role: "Operations Director, TechFlow",
                avatar: "https://i.pravatar.cc/150?u=sarah"
              },
              {
                text: "Finally, an ERP that doesn't feel like software from the 90s. It's clean, incredibly fast, and actually helps us grow.",
                author: "Michael Ross",
                role: "Founder, Zenith Scale",
                avatar: "https://i.pravatar.cc/150?u=michael"
              },
              {
                text: "The integration between invoicing and project milestones is seamless. It has saved our finance team dozens of hours every month.",
                author: "David Lee",
                role: "Head of Finance, Global Horizon",
                avatar: "https://i.pravatar.cc/150?u=david"
              }
            ].map((item, index) => (
              <div key={index} className="landing-testimonial-card">
                <div className="landing-testimonial-quote">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 3.5-1 4.5-4 4.5V21zm14 0c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c0 3.5-1 4.5-4 4.5V21z"/>
                  </svg>
                </div>
                <p className="landing-testimonial-text">{item.text}</p>
                <div className="landing-testimonial-author">
                  <img src={item.avatar} alt={item.author} className="landing-testimonial-avatar" />
                  <div className="landing-testimonial-info">
                    <h4 className="landing-testimonial-name">{item.author}</h4>
                    <p className="landing-testimonial-role">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="landing-pricing" id="pricing">
        <div className="landing-pricing__wrap">
          <div className="landing-pricing__bg">
            <img src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop" alt="" />
          </div>
          <div className="landing-pricing__overlay"></div>

          <div className="landing-pricing__container">
            <div className="landing-pricing__content">
              {/* Left — Plan List */}
              <div className="landing-pricing__left">
                <h2 className="landing-pricing__heading">Flexible pricing</h2>
                <div className="landing-pricing__plans-box">
                  {[
                    { id: 'starter', name: 'Starter', sub: 'For early-stage teams' },
                    { id: 'growth', name: 'Growth', sub: 'Most popular' },
                    { id: 'scale', name: 'Scale', sub: 'For fast-scaling startups' }
                  ].map(plan => (
                    <button
                      key={plan.id}
                      className={`landing-pricing__plan-btn ${activePricePlan === plan.id ? 'active' : ''}`}
                      onClick={() => setActivePricePlan(plan.id)}
                    >
                      <div className="landing-pricing__plan-info">
                        <span className="landing-pricing__plan-title">{plan.name}</span>
                        <span className="landing-pricing__plan-subtitle">{plan.sub}</span>
                      </div>
                      <div className="landing-pricing__plan-check">
                        <FiCheck />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="landing-pricing__social-proof">
                  <div className="landing-pricing__user-avatars">
                    <img src="https://i.pravatar.cc/150?u=a1" alt="User" />
                    <img src="https://i.pravatar.cc/150?u=b2" alt="User" />
                    <img src="https://i.pravatar.cc/150?u=c3" alt="User" />
                    <img src="https://i.pravatar.cc/150?u=d4" alt="User" />
                  </div>
                  <div className="landing-pricing__rating-info">
                    <div className="landing-pricing__star-rating">
                      <FiStar style={{ fill: '#f59e0b', color: '#f59e0b' }} /> 4.9 / 5 Rated
                    </div>
                    <p>Over 9.2k Customers</p>
                  </div>
                </div>
              </div>

              {/* Right — Glass Card */}
              <div className="landing-pricing__right-col">
                <div className="landing-pricing__glass-card">
                  <div className="landing-pricing__card-top">
                    <div className="landing-pricing__type-icon">
                      <FiZap />
                    </div>
                    <h3>{pricingPlans[activePricePlan].name}</h3>
                  </div>

                  <div className="landing-pricing__price-display">
                    <div className="landing-pricing__main-price">
                      <span className="amount">{pricingPlans[activePricePlan].price}</span>
                      {activePricePlan !== 'starter' && <span className="period">/ mo</span>}
                    </div>
                    <p className="landing-pricing__price-text">{pricingPlans[activePricePlan].desc}</p>
                  </div>

                  <button className="landing-pricing__cta-main" onClick={() => navigate('/onboarding')}>
                    Try now
                    <span className="landing-pricing__cta-arrow">
                      <ArrowRight size={14} />
                    </span>
                  </button>

                  <div className="landing-pricing__feature-items">
                    {pricingPlans[activePricePlan].features.map((feature, i) => (
                      <div key={i} className="landing-pricing__feature-row">
                        <FiCheck />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Modern Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="landing-footer__grid">
            <div className="landing-footer__brand">
              <div className="landing-nav__logo">
                <img src="/images/logo.png" alt="DevelopWork" className="landing-nav__logo-img" />
                <span>DevelopWork</span>
              </div>
              <p className="landing-footer__tagline">
                The intelligent work operating system for modern startups and high-growth teams.
              </p>
              <div className="landing-footer__socials">
                <a href="#" className="landing-footer__social-link">𝕏</a>
                <a href="#" className="landing-footer__social-link">in</a>
                <a href="#" className="landing-footer__social-link">gh</a>
              </div>
            </div>

            <div className="landing-footer__links">
              <div className="landing-footer__col">
                <h4 className="landing-footer__heading">Product</h4>
                <ul>
                  <li><a href="#performance">Platform Hub</a></li>
                  <li><a href="#testimonials">Testimonials</a></li>
                  <li><a href="#pricing">Pricing Plans</a></li>
                  <li><a href="#">Release Notes</a></li>
                </ul>
              </div>
              
              <div className="landing-footer__col">
                <h4 className="landing-footer__heading">Modules</h4>
                <ul>
                  <li><a href="#">Client Portal</a></li>
                  <li><a href="#">KPI Tracking</a></li>
                  <li><a href="#">AI Assistant</a></li>
                  <li><a href="#">Finance Sync</a></li>
                </ul>
              </div>

              <div className="landing-footer__col">
                <h4 className="landing-footer__heading">Resources</h4>
                <ul>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">API Reference</a></li>
                  <li><a href="#">Community</a></li>
                  <li><a href="#">Help Center</a></li>
                </ul>
              </div>

              <div className="landing-footer__col">
                <h4 className="landing-footer__heading">Company</h4>
                <ul>
                  <li><a href="#">Our Story</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p>&copy; 2026 DevelopWork Inc. Built with precision for the next generation of builders.</p>
            <div className="landing-footer__status">
              <span className="landing-status-dot"></span>
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
