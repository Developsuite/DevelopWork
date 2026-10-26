type Data = Record<string, unknown>;

export interface EmailContext {
  appUrl: string;
  senderName: string;
  senderTitle: string;
}

export interface BuiltEmail {
  html: string;
  text: string;
}

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v)).trim();

const esc = (v: unknown): string =>
  str(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeUrl = (v: unknown): string => {
  const s = str(v);
  return /^https?:\/\//i.test(s) ? s : "";
};

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// Convert plain text with optional **bold** into clean paragraphs.
const paragraphs = (text: string): string =>
  text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = esc(p)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:#1F2937;">${html}</p>`;
    })
    .join("");

interface LayoutOptions {
  preview?: string;    // short preview text shown in inbox previews
  title: string;
  bodyHtml?: string;
  details?: Array<[string, string]>;
  cta?: { label: string; url: string };
}

// Corporate transactional email — like Linear / Notion / Vercel / Stripe.
// Clean white sheet, left-aligned, compact typography, thin dividers, no
// coloured banners, no logos. Reads like a document, not a marketing blast.
function layout(ctx: EmailContext, o: LayoutOptions): string {
  const details = (o.details || []).filter(([, v]) => v);
  const detailRows = details
    .map(([label, value]) => `
      <tr>
        <td style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;color:#6B7280;width:120px;vertical-align:top;">${esc(label)}</td>
        <td style="padding:6px 0;font-family:${FONT_STACK};font-size:14px;color:#111827;font-weight:500;">${esc(value)}</td>
      </tr>`)
    .join("");

  const previewText = o.preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;font-size:1px;line-height:1px;color:#F9FAFB;">${esc(o.preview)}</div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:#F6F7F9;font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${previewText}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7F9;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E7EB;">

        <tr><td style="padding:28px 40px 20px;border-bottom:1px solid #E5E7EB;">
          <p style="margin:0;font-family:${FONT_STACK};font-size:13px;font-weight:600;color:#111827;letter-spacing:-0.1px;">DevelopWork</p>
        </td></tr>

        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0 0 24px;font-family:${FONT_STACK};font-size:20px;line-height:1.35;font-weight:600;color:#111827;letter-spacing:-0.2px;">${esc(o.title)}</h1>
          ${o.bodyHtml || ""}
          ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;padding:8px 0;">${detailRows}</table>` : ""}
          ${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;"><tr><td style="background:#111827;"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:11px 20px;font-family:${FONT_STACK};font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;letter-spacing:-0.1px;">${esc(o.cta.label)}</a></td></tr></table>` : ""}
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:#374151;">${esc(ctx.senderName)}</p>
          <p style="margin:2px 0 0;font-family:${FONT_STACK};font-size:13px;color:#6B7280;">${esc(ctx.senderTitle)}</p>
        </td></tr>

      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td style="padding:20px 4px 0;font-family:${FONT_STACK};font-size:12px;color:#9CA3AF;line-height:1.5;">
          You are receiving this because you are a member of a DevelopWork workspace.<br>
          <a href="${esc(ctx.appUrl)}" style="color:#9CA3AF;text-decoration:underline;">Open DevelopWork</a>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

function textVersion(title: string, body: string, details: Array<[string, string]>, link: string, ctx: EmailContext): string {
  const lines = [title, "", body.trim()];
  const d = details.filter(([, v]) => v);
  if (d.length) lines.push("", ...d.map(([k, v]) => `${k}: ${v}`));
  lines.push("", link, "", `${ctx.senderName}`, ctx.senderTitle);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

export function buildTaskAssigned(ctx: EmailContext, data: Data): BuiltEmail {
  const title = str(data.task_title) || str(data.title) || "New task assigned";
  const body = str(data.message) || str(data.description);
  const details: Array<[string, string]> = [
    ["Priority", str(data.priority)],
    ["Due date", str(data.deadline)],
    ["Project", str(data.project)],
    ["Assigned by", str(data.assigned_by)],
  ];
  const cta = { label: "View task", url: `${ctx.appUrl}/employee/dashboard` };
  const bodyText = body || `A new task has been assigned to you${data.deadline ? ` with a due date of ${str(data.deadline)}` : ""}.`;
  return {
    html: layout(ctx, {
      preview: `New task: ${title}`,
      title,
      bodyHtml: paragraphs(bodyText),
      details,
      cta,
    }),
    text: textVersion(title, bodyText, details, cta.url, ctx),
  };
}

export function buildMeeting(ctx: EmailContext, data: Data): BuiltEmail {
  const title = str(data.title) || "Meeting invitation";
  const body = str(data.message) || str(data.description);
  const link = safeUrl(data.meeting_link) || safeUrl(data.link);
  const details: Array<[string, string]> = [
    ["Date", str(data.date)],
    ["Time", str(data.time)],
    ["Duration", data.duration ? `${str(data.duration)} min` : ""],
    ["Where", str(data.platform) || str(data.location)],
  ];
  const cta = link ? { label: "Join meeting", url: link } : { label: "View in DevelopWork", url: ctx.appUrl };
  const bodyText = body || "You have been invited to the following meeting.";
  return {
    html: layout(ctx, {
      preview: `Meeting: ${title}`,
      title,
      bodyHtml: paragraphs(bodyText),
      details,
      cta,
    }),
    text: textVersion(title, bodyText, details, cta.url, ctx),
  };
}

export function buildMessage(ctx: EmailContext, data: Data, subject: string): BuiltEmail {
  const title = str(data.title) || subject || "Message";
  const body = str(data.message) || str(data.body);
  const cta = { label: "Open DevelopWork", url: ctx.appUrl };
  return {
    html: layout(ctx, {
      preview: body.slice(0, 110),
      title,
      bodyHtml: body ? paragraphs(body) : "",
      cta,
    }),
    text: textVersion(title, body, [], cta.url, ctx),
  };
}
