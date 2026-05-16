-- =============================================================
-- DevelopWork — Seed Data for all modules
-- Run this in Supabase SQL Editor AFTER the schema migration
-- =============================================================

-- ========================
-- EMPLOYEES (HR Module)
-- ========================
INSERT INTO employees (name, role, department, email, phone, location, employment_type, status, join_date, skills, salary, bonus, deductions) VALUES
('Abbas Khan', 'Product Lead', 'Engineering', 'abbas@developwork.com', '+92 300 1234567', 'Islamabad', 'Full-time', 'Active', '2024-01-15', ARRAY['React', 'Node.js', 'MongoDB'], 95000, 5000, 12000),
('Sarah Ahmed', 'UI/UX Designer', 'Design', 'sarah@developwork.com', '+92 300 2345678', 'Lahore', 'Full-time', 'Active', '2024-03-10', ARRAY['Figma', 'Design Systems', 'CSS'], 78000, 3000, 9800),
('Ali Hassan', 'Backend Developer', 'Engineering', 'ali@developwork.com', '+92 300 3456789', 'Karachi', 'Full-time', 'Active', '2024-06-01', ARRAY['Python', 'Django', 'PostgreSQL'], 82000, 4000, 10500),
('Fatima Noor', 'QA Engineer', 'Engineering', 'fatima@developwork.com', '+92 300 4567890', 'Islamabad', 'Part-time', 'On Leave', '2024-09-15', ARRAY['Selenium', 'Jest', 'Cypress'], 45000, 0, 5600),
('Omar Raza', 'Operations Manager', 'Operations', 'omar@developwork.com', '+92 300 5678901', 'Rawalpindi', 'Full-time', 'Active', '2024-02-20', ARRAY['Project Mgmt', 'Agile', 'Scrum'], 88000, 4500, 11200),
('Usman Ali', 'DevOps Engineer', 'Engineering', 'usman@developwork.com', '+92 300 6789012', 'Islamabad', 'Full-time', 'Active', '2024-04-10', ARRAY['AWS', 'Docker', 'Kubernetes'], 85000, 3500, 10800);

-- ========================
-- LEAVE REQUESTS
-- ========================
INSERT INTO leave_requests (employee_id, employee_name, type, from_date, to_date, reason, status) VALUES
((SELECT id FROM employees WHERE name = 'Fatima Noor'), 'Fatima Noor', 'Annual', '2026-04-20', '2026-04-25', 'Family vacation', 'Pending'),
((SELECT id FROM employees WHERE name = 'Ali Hassan'), 'Ali Hassan', 'Sick', '2026-04-18', '2026-04-18', 'Medical appointment', 'Approved'),
((SELECT id FROM employees WHERE name = 'Omar Raza'), 'Omar Raza', 'Annual', '2026-05-01', '2026-05-05', 'Personal travel', 'Pending');

-- ========================
-- CANDIDATES (Recruitment)
-- ========================
INSERT INTO candidates (name, role, source, application_date, stage) VALUES
('Ahmed Ali', 'Frontend Developer', 'LinkedIn', '2026-03-01', 'Interview'),
('Zainab Shah', 'Product Manager', 'Referral', '2026-03-10', 'Screening'),
('Hassan Malik', 'DevOps Engineer', 'Indeed', '2026-02-15', 'Offer'),
('Ayesha Siddiq', 'Data Analyst', 'LinkedIn', '2026-03-20', 'Applied'),
('Bilal Khan', 'UI Designer', 'Direct', '2026-02-28', 'Hired');

-- ========================
-- PERFORMANCE REVIEWS
-- ========================
INSERT INTO performance_reviews (employee_id, employee_name, rating, feedback, goals, review_date) VALUES
((SELECT id FROM employees WHERE name = 'Abbas Khan'), 'Abbas Khan', 5, 'Exceptional leadership. Delivered all Q1 milestones ahead of schedule.', '["Launch v2.0", "Hire 3 engineers", "Improve test coverage to 80%"]'::jsonb, '2026-03-15'),
((SELECT id FROM employees WHERE name = 'Sarah Ahmed'), 'Sarah Ahmed', 4, 'Great design contributions. Design system adoption increased by 60%.', '["Redesign dashboard", "Create component library", "Mentor junior designer"]'::jsonb, '2026-03-15'),
((SELECT id FROM employees WHERE name = 'Ali Hassan'), 'Ali Hassan', 4, 'Strong backend skills. API response times improved by 40%.', '["Migrate to microservices", "Implement caching layer", "Write API documentation"]'::jsonb, '2026-03-15');

-- ========================
-- TRANSACTIONS (Finance)
-- ========================
INSERT INTO transactions (type, category, description, amount, date, status) VALUES
('income', 'Software Sales', 'Enterprise License - Q1', 45000, '2026-03-01', 'completed'),
('income', 'Consulting', 'Cloud Migration - TechCorp', 28000, '2026-03-05', 'completed'),
('expense', 'Salary', 'March Payroll', 380000, '2026-03-25', 'completed'),
('expense', 'Software', 'AWS Monthly', 12500, '2026-03-01', 'completed'),
('expense', 'Travel', 'Client Meeting - Lahore', 15000, '2026-03-10', 'completed'),
('income', 'Software Sales', 'SaaS Subscription - Monthly', 18000, '2026-04-01', 'completed'),
('expense', 'Office', 'Internet & Utilities', 8500, '2026-04-01', 'completed'),
('income', 'Consulting', 'Security Audit - FinBank', 35000, '2026-04-05', 'pending');

-- ========================
-- INVOICES
-- ========================
INSERT INTO invoices (id, client_name, amount, due_date, status, items) VALUES
('INV-001', 'TechCorp Ltd', 45000, '2026-04-15', 'Paid', '[{"description": "Enterprise License", "qty": 1, "rate": 45000}]'::jsonb),
('INV-002', 'Digital Solutions', 28000, '2026-04-30', 'Sent', '[{"description": "Cloud Migration", "qty": 1, "rate": 28000}]'::jsonb),
('INV-003', 'FinBank', 35000, '2026-05-15', 'Draft', '[{"description": "Security Audit", "qty": 1, "rate": 35000}]'::jsonb),
('INV-004', 'StartupXYZ', 15000, '2026-03-30', 'Overdue', '[{"description": "MVP Development", "qty": 1, "rate": 15000}]'::jsonb);

-- ========================
-- EXPENSES (Approval Workflow)
-- ========================
INSERT INTO expenses (type, requester_name, category, amount, date, reason, status) VALUES
('individual', 'Ali Hassan', 'Travel', 15000, '2026-03-10', 'Client meeting in Lahore - flight + hotel', 'Pending'),
('individual', 'Sarah Ahmed', 'Equipment', 25000, '2026-03-15', 'New monitor for design work', 'Approved'),
('company', 'Operations', 'Software', 12500, '2026-03-01', 'AWS monthly infrastructure costs', 'Approved'),
('individual', 'Omar Raza', 'Training', 8000, '2026-04-01', 'Agile certification course', 'Pending');

-- ========================
-- LEADS (CRM)
-- ========================
INSERT INTO leads (name, company, contact_person, email, phone, stage, value, priority, location, last_contact) VALUES
('Enterprise Deal', 'TechCorp Ltd', 'Ahmed Director', 'ahmed@techcorp.com', '+92 300 1112233', 'Proposal', 150000, 'High', 'Islamabad', '2 days ago'),
('SaaS License', 'Digital Solutions', 'Fatima CEO', 'fatima@digitalsol.com', '+92 300 2223344', 'Negotiation', 85000, 'High', 'Lahore', '1 week ago'),
('Startup MVP', 'StartupXYZ', 'Bilal Founder', 'bilal@startupxyz.com', '+92 300 3334455', 'Qualified', 45000, 'Medium', 'Karachi', '3 days ago'),
('Cloud Migration', 'FinBank', 'Hassan CTO', 'hassan@finbank.com', '+92 300 4445566', 'New', 200000, 'High', 'Islamabad', 'Today'),
('Web Redesign', 'MediaHouse', 'Ayesha PM', 'ayesha@mediahouse.com', '+92 300 5556677', 'Contacted', 35000, 'Low', 'Rawalpindi', '5 days ago'),
('Mobile App', 'RetailChain', 'Usman Dir', 'usman@retailchain.com', '+92 300 6667788', 'Closed', 120000, 'Medium', 'Lahore', '2 weeks ago');

-- ========================
-- CONTACTS (CRM)
-- ========================
INSERT INTO contacts (name, role, company, email, phone) VALUES
('Ahmed Director', 'Director of Engineering', 'TechCorp Ltd', 'ahmed@techcorp.com', '+92 300 1112233'),
('Fatima CEO', 'Chief Executive Officer', 'Digital Solutions', 'fatima@digitalsol.com', '+92 300 2223344'),
('Bilal Founder', 'Founder & CEO', 'StartupXYZ', 'bilal@startupxyz.com', '+92 300 3334455'),
('Hassan CTO', 'Chief Technology Officer', 'FinBank', 'hassan@finbank.com', '+92 300 4445566'),
('Ayesha PM', 'Project Manager', 'MediaHouse', 'ayesha@mediahouse.com', '+92 300 5556677');

-- ========================
-- CLIENTS
-- ========================
INSERT INTO clients (name, company, email, phone, address, status, payment_status) VALUES
('TechCorp Ltd', 'TechCorp Ltd', 'info@techcorp.com', '+92 300 1112233', 'Blue Area, Islamabad', 'In Progress', 'Paid'),
('Digital Solutions', 'Digital Solutions', 'info@digitalsol.com', '+92 300 2223344', 'Gulberg III, Lahore', 'In Progress', 'Partial'),
('StartupXYZ', 'StartupXYZ', 'info@startupxyz.com', '+92 300 3334455', 'Clifton, Karachi', 'Pending', 'Unpaid'),
('FinBank', 'FinBank', 'info@finbank.com', '+92 300 4445566', 'F-7, Islamabad', 'Not Started', 'Unpaid'),
('MediaHouse', 'MediaHouse', 'info@mediahouse.com', '+92 300 5556677', 'Saddar, Rawalpindi', 'Completed', 'Paid');

-- ========================
-- DOCUMENTS
-- ========================
INSERT INTO documents (title, content, category, type, owner_name, shared, views) VALUES
('Product Roadmap 2026', '# Product Roadmap\n\n## Q1 Goals\n- Launch v2.0\n- Improve performance by 40%\n\n## Q2 Goals\n- Mobile app release\n- Enterprise features', 'Strategy', 'document', 'Abbas Khan', true, 45),
('API Documentation', '# API Reference\n\n## Authentication\nAll endpoints require Bearer token.\n\n## Endpoints\n- GET /api/users\n- POST /api/projects', 'Technical', 'wiki', 'Ali Hassan', true, 128),
('Design System Guide', '# Design System\n\n## Colors\n- Primary: #579BFC\n- Success: #00C875\n\n## Typography\n- Headings: Inter Bold\n- Body: Inter Regular', 'Design', 'document', 'Sarah Ahmed', true, 67),
('Employee Handbook', '# Employee Handbook\n\n## Working Hours\n9 AM - 6 PM, Monday to Friday\n\n## Leave Policy\n- Annual: 15 days\n- Sick: 10 days', 'HR', 'template', 'Omar Raza', false, 23),
('Sprint Planning Template', '# Sprint Planning\n\n## Sprint Goal\n[Define the sprint goal]\n\n## User Stories\n1. As a user...\n2. As an admin...', 'General', 'template', 'Abbas Khan', true, 89);

-- Done! All modules now have seed data.
