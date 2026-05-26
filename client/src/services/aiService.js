import { projectService } from './projectService';
import { managerService } from './managerService';
import { clientsService } from './clientsService';
import { financeService } from './financeService';
import { hrService } from './hrService';
import { leadsService } from './leadsService';
import { docsService } from './docsService';
import { supabase } from '../lib/supabase';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = "openai/gpt-4o-mini"; // Fast, reliable, supports tool calling natively

// Define the tools available to the AI
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Get a list of all projects the current user has access to. Use this to find active projects, statuses, and budgets.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_all_tasks",
      description: "Get all tasks across all projects the user has access to. Good for finding overall progress or stuck tasks.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_my_tasks",
      description: "Get only the tasks specifically assigned to the currently logged in user.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_team_directory",
      description: "Get a list of all managers and employees in the system.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Get a list of all clients in the system.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_finance_transactions",
      description: "Get all financial transactions, including income and expenses.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_finance_invoices",
      description: "Get all invoices from the finance module.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_hr_employees",
      description: "Get HR specific employee data, which might include roles, salaries, and departments.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_hr_leave_requests",
      description: "Get all employee leave requests (HR).",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_leads",
      description: "Get all sales leads and their pipeline statuses.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_documents",
      description: "Get all documents and files in the system.",
      parameters: { type: "object", properties: {} }
    }
  }
];

// Helper to execute local tools based on AI's request
const executeTool = async (toolCall, user) => {
  const { name } = toolCall.function;
  const role = user?.role;
  const assignedModule = user?.assignedModule;

  console.log(`[AI] Executing tool: ${name} for user role: ${role}, module: ${assignedModule}`);
  
  // SECURE PERMISSION CHECK
  const isFinanceTool = name.includes('finance') || name.includes('invoice') || name.includes('transaction');
  const isHRTool = name.includes('hr') || name.includes('leave');
  const isLeadsTool = name.includes('leads') || name.includes('client');
  const isProjectTool = name.includes('project') || (name.includes('task') && name !== 'get_my_tasks');

  // 1. Admin can access everything
  if (role === 'admin') {
    // proceed
  } 
  // 2. Manager Access (Restricted to their module)
  else if (role === 'manager') {
    if (isFinanceTool && assignedModule !== 'finance') return { error: "Access Denied. Managers can only access Finance data if assigned to that module." };
    if (isHRTool && assignedModule !== 'hr') return { error: "Access Denied. Managers can only access HR data if assigned to that module." };
    if (isLeadsTool && assignedModule !== 'leads' && assignedModule !== 'clients') return { error: "Access Denied. Managers can only access CRM/Leads data if assigned to those modules." };
    // Managers can generally see projects and tasks to help with coordination
  }
  // 3. Employee Access
  else {
    if (isFinanceTool || isHRTool || isLeadsTool) {
        return { error: "Access Denied. Standard employees cannot query sensitive department data via AI." };
    }
    // Employees ARE allowed to query projects and tasks (RLS will automatically filter to only show what they are allowed to see)
  }

  try {
    switch (name) {
      case "get_projects":
        return await projectService.getAll();
      case "get_all_tasks":
        return await projectService.getAllTasks();
      case "get_my_tasks":
        return await projectService.getTasksByAssignee(user.id, user.name);
      case "get_team_directory":
        // Only return safe fields (no passwords)
        const users = await managerService.getAllUsers();
        return users.map(u => ({ id: u.id, name: u.name, role: u.role, module: u.assigned_module }));
      case "get_clients":
        return await clientsService.getClients();
      case "get_finance_transactions":
        return await financeService.getTransactions();
      case "get_finance_invoices":
        return await financeService.getInvoices();
      case "get_hr_employees":
        return await hrService.getEmployees();
      case "get_hr_leave_requests":
        return await hrService.getLeaveRequests();
      case "get_leads":
        return await leadsService.getLeads();
      case "get_documents":
        return await docsService.getDocuments();
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    console.error(`[AI] Tool execution failed:`, error);
    return { error: "You don't have permission to access this data, or an error occurred." };
  }
};

export const aiService = {
  async sendMessage(messages, user) {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API Key is missing.");
    }

    // System prompt helps guide the AI
    const systemPrompt = {
      role: "system",
      content: `You are Zappy, the DevelopWork ERP AI Assistant. You help users manage their projects, tasks, and team.
      The current user's name is ${user.name} and their role is ${user.role}.
      
      CRITICAL INSTRUCTIONS:
      1. If the user asks about their own tasks, personal tasks, or what tasks are assigned to them, you MUST use the 'get_my_tasks' tool. Do NOT use 'get_all_tasks' for personal task queries.
      2. Do not tell users you don't have permission for tasks unless a tool explicitly returns an 'Access Denied' error.
      3. Always be concise, professional, and helpful. Use tools to fetch real data before answering questions.
      4. Format your responses nicely with markdown. Do not guess numbers; always use tools.
      5. A task is considered "pending" or "active" if its status is anything other than "Done". Tasks with status "Done" are fully completed and should NOT be counted as pending.`
    };

    const conversation = [systemPrompt, ...messages];

    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: conversation,
        tools: TOOLS,
        tool_choice: "auto",
        max_tokens: 1000
      })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to communicate with AI");
    }

    let data = await response.json();
    let message = data.choices[0].message;

    // If the AI decides to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      conversation.push(message); // Add the AI's tool request to history
      
      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const result = await executeTool(toolCall, user);
        conversation.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify(result)
        });
      }

      // Send the results back to the AI for a final answer
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: conversation,
          max_tokens: 1000
        })
      });

      data = await response.json();
      message = data.choices[0].message;
    }

    return message;
  }
};
