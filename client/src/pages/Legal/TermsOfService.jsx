import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import './Legal.css';

const LAST_UPDATED = 'October 20, 2026';
const CONTACT_EMAIL = 'support@thedevelopwork.com';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-root">
            <header className="legal-header">
                <button className="legal-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="legal-brand"><Shield size={18} /> DevelopWork</div>
            </header>

            <main className="legal-body">
                <h1>Terms of Service</h1>
                <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

                <p>These Terms of Service ("Terms") govern your access to and use of the DevelopWork platform
                (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>

                <h2>1. Accounts</h2>
                <p>Access to the Service is provided through accounts issued by a workspace administrator or the
                platform operator. You are responsible for maintaining the confidentiality of your login
                credentials and for all activity under your account. Notify us promptly of any unauthorized use.</p>

                <h2>2. Acceptable Use</h2>
                <ul>
                    <li>Do not use the Service for any unlawful, harmful, or fraudulent purpose.</li>
                    <li>Do not attempt to access data belonging to other workspaces or users.</li>
                    <li>Do not interfere with, disrupt, or compromise the security or integrity of the Service.</li>
                    <li>Do not upload malicious code or attempt to reverse-engineer the platform.</li>
                </ul>

                <h2>3. Your Content</h2>
                <p>You retain ownership of the data and content you create within your workspace ("Your Content").
                You grant us a limited license to host, process, and display Your Content solely to provide and
                maintain the Service. You are responsible for the accuracy and legality of Your Content.</p>

                <h2>4. Workspaces &amp; Roles</h2>
                <p>Workspaces may include administrators, managers, and employees with different permissions.
                Administrators are responsible for managing their workspace, including inviting users, assigning
                roles, and controlling access to data and features.</p>

                <h2>5. AI Features</h2>
                <p>The Service includes AI-assisted features that act on your workspace data at your request.
                AI output may occasionally be inaccurate or incomplete. You are responsible for reviewing and
                confirming actions before relying on them, particularly for financial, legal, or operational decisions.</p>

                <h2>6. Notifications</h2>
                <p>By connecting email or Telegram notifications, you consent to receive workspace-related
                messages through those channels. You may disconnect these integrations at any time.</p>

                <h2>7. Service Availability</h2>
                <p>We strive to keep the Service available and reliable but do not guarantee uninterrupted access.
                We may modify, suspend, or discontinue features with reasonable notice where practicable.</p>

                <h2>8. Intellectual Property</h2>
                <p>The Service, including its software, design, and branding, is owned by DevelopWork and protected
                by applicable laws. These Terms do not grant you any rights to our trademarks or intellectual property.</p>

                <h2>9. Disclaimer of Warranties</h2>
                <p>The Service is provided "as is" and "as available" without warranties of any kind, whether express
                or implied, including fitness for a particular purpose and non-infringement, to the fullest extent
                permitted by law.</p>

                <h2>10. Limitation of Liability</h2>
                <p>To the maximum extent permitted by law, DevelopWork shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of data, profits, or revenue
                arising from your use of the Service.</p>

                <h2>11. Termination</h2>
                <p>We may suspend or terminate your access if you violate these Terms. You may stop using the
                Service at any time. Upon termination, your right to access the Service ends.</p>

                <h2>12. Changes to These Terms</h2>
                <p>We may update these Terms from time to time. Continued use of the Service after changes take
                effect constitutes acceptance of the revised Terms.</p>

                <h2>13. Contact Us</h2>
                <p>Questions about these Terms? Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>

                <div className="legal-footer">
                    <a onClick={() => navigate('/privacy')}>Privacy Policy</a>
                    <span>·</span>
                    <a onClick={() => navigate('/login')}>Back to app</a>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
