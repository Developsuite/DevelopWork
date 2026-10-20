import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import './Legal.css';

const LAST_UPDATED = 'October 20, 2026';
const CONTACT_EMAIL = 'support@thedevelopwork.com';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-root">
            <header className="legal-header">
                <button className="legal-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                <div className="legal-brand"><Shield size={18} /> DevelopWork</div>
            </header>

            <main className="legal-body">
                <h1>Privacy Policy</h1>
                <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

                <p>DevelopWork ("we", "us", or "our") provides an all-in-one workspace management platform
                for teams, including project, task, client, finance, HR, document, and communication tools.
                This Privacy Policy explains how we collect, use, store, and protect information when you use
                our platform (the "Service").</p>

                <h2>1. Information We Collect</h2>
                <ul>
                    <li><strong>Account information:</strong> name, email address, password (stored encrypted), role, and profile details you provide.</li>
                    <li><strong>Workspace data:</strong> projects, tasks, leads, clients, invoices, expenses, documents, meetings, and other content you or your team create within the Service.</li>
                    <li><strong>Integration data:</strong> if you connect Telegram or email notifications, we store the identifiers needed to deliver those notifications (e.g. your Telegram chat ID, email address).</li>
                    <li><strong>Usage information:</strong> log data such as actions taken, timestamps, and technical information needed to operate and secure the Service.</li>
                </ul>

                <h2>2. How We Use Your Information</h2>
                <ul>
                    <li>To provide, maintain, and improve the Service.</li>
                    <li>To authenticate users and enforce workspace access controls.</li>
                    <li>To deliver notifications you request (in-app, email, or Telegram).</li>
                    <li>To power AI-assisted features that act only on your own workspace data at your request.</li>
                    <li>To secure the Service, prevent abuse, and comply with legal obligations.</li>
                </ul>

                <h2>3. Data Isolation &amp; Multi-Tenancy</h2>
                <p>Each workspace (tenant) is isolated. Your workspace data is only accessible to users within
                your own workspace, enforced at the database level through row-level security. One organization
                cannot access another organization's data.</p>

                <h2>4. AI Features</h2>
                <p>Our AI assistant processes your commands to help you manage your workspace. Requests are sent
                to a third-party AI model provider solely to generate responses. We do not sell your data, and
                AI features operate only within your own workspace scope and permissions.</p>

                <h2>5. Third-Party Services</h2>
                <p>We rely on trusted providers to operate the Service, including Supabase (database, authentication,
                hosting), Resend (transactional email), Telegram (optional notifications), and an AI model provider.
                These providers process data only as needed to deliver their function.</p>

                <h2>6. Data Retention</h2>
                <p>We retain your information for as long as your account is active or as needed to provide the
                Service. You may request deletion of your account and associated data by contacting us.</p>

                <h2>7. Security</h2>
                <p>We use industry-standard measures including encrypted passwords, encrypted connections (HTTPS),
                access controls, and row-level security to protect your data. No method of transmission or storage
                is completely secure, but we work to protect your information.</p>

                <h2>8. Your Rights</h2>
                <p>Depending on your location, you may have the right to access, correct, export, or delete your
                personal data. To exercise these rights, contact us at the address below.</p>

                <h2>9. Children's Privacy</h2>
                <p>The Service is not intended for individuals under 16. We do not knowingly collect data from children.</p>

                <h2>10. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. Material changes will be reflected by
                updating the "Last updated" date above.</p>

                <h2>11. Contact Us</h2>
                <p>If you have questions about this Privacy Policy, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>

                <div className="legal-footer">
                    <a onClick={() => navigate('/terms')}>Terms of Service</a>
                    <span>·</span>
                    <a onClick={() => navigate('/login')}>Back to app</a>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
