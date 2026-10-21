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

// Plain text (possibly with **bold** from the AI) -> paragraphs with line breaks.
const paragraphs = (text: string): string =>
  text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = esc(p).replace(/\*\*(.+?)\*\*/g, "<strong style=\"color:#FFFFFF;font-weight:600;\">$1</strong>").replace(/\n/g, "<br>");
      return `<p style="margin:0 0 18px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#C9D1DB;letter-spacing:-0.1px;">${html}</p>`;
    })
    .join("");

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "D";

interface LayoutOptions {
  eyebrow: string;
  title: string;
  bodyHtml?: string;
  details?: Array<[string, string]>;
  cta?: { label: string; url: string };
}

// Dark card, rounded corners, no images, one link — reads as a personal note, not a newsletter.
function layout(ctx: EmailContext, o: LayoutOptions): string {
  const details = (o.details || []).filter(([, v]) => v);
  const detailRows = details
    .map(
      ([label, value], i) => `
        <tr>
          <td style="padding:13px 18px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#8A94A6;width:38%;${i ? "border-top:1px solid #242C3D;" : ""}">${esc(label)}</td>
          <td style="padding:13px 18px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#F4F6FB;font-weight:600;${i ? "border-top:1px solid #242C3D;" : ""}">${esc(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${esc(o.title)}</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
    body { margin:0 !important; padding:0 !important; }
    a { text-decoration:none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#0B1020;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0B1020;">
    <tr><td align="center" style="padding:36px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#161B2C;border:1px solid #232A42;border-radius:20px;">
        <tr><td style="padding:36px 40px 10px;">
          <p style="margin:0 0 20px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#4D8BFF;letter-spacing:-0.2px;">DevelopWork</p>
          <p style="margin:0 0 10px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#7A8599;">${esc(o.eyebrow)}</p>
          <h1 style="margin:0 0 22px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.3;font-weight:700;color:#FFFFFF;letter-spacing:-0.4px;">${esc(o.title)}</h1>
          ${o.bodyHtml || ""}
          ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 26px;background:#1C2237;border:1px solid #242C3D;border-radius:14px;border-collapse:separate;">${detailRows}</table>` : ""}
          ${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 28px;"><tr><td style="background:#2563EB;border-radius:12px;"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:14px 28px;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:-0.1px;">${esc(o.cta.label)}</a></td></tr></table>` : ""}
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:#232A42;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:20px 40px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;">
              <div style="width:36px;height:36px;border-radius:50%;background:#2A3350;color:#9BB4FF;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;line-height:36px;text-align:center;">${esc(initials(ctx.senderName))}</div>
            </td>
            <td style="vertical-align:middle;padding-left:14px;">
              <p style="margin:0;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#F4F6FB;letter-spacing:-0.1px;">${esc(ctx.senderName)}</p>
              <p style="margin:3px 0 0;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#7A8599;">${esc(ctx.senderTitle)}</p>
            </td>
          </tr></table>
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
  lines.push("", link, "", `${ctx.senderName}, ${ctx.senderTitle}`);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

export function buildTaskAssigned(ctx: EmailContext, data: Data): BuiltEmail {
  const title = str(data.task_title) || str(data.title) || "New task";
  const body = str(data.message) || str(data.description);
  const details: Array<[string, string]> = [
    ["Priority", str(data.priority)],
    ["Due date", str(data.deadline)],
    ["Project", str(data.project)],
    ["Assigned by", str(data.assigned_by)],
  ];
  const cta = { label: "View task", url: `${ctx.appUrl}/employee/dashboard` };
  return {
    html: layout(ctx, { eyebrow: "New task assigned", title, bodyHtml: body ? paragraphs(body) : "", details, cta }),
    text: textVersion(`New task assigned: ${title}`, body, details, cta.url, ctx),
  };
}

export function buildMeeting(ctx: EmailContext, data: Data): BuiltEmail {
  const title = str(data.title) || "Meeting";
  const body = str(data.message) || str(data.description);
  const link = safeUrl(data.meeting_link) || safeUrl(data.link);
  const details: Array<[string, string]> = [
    ["Date", str(data.date)],
    ["Time", str(data.time)],
    ["Duration", data.duration ? `${str(data.duration)} min` : ""],
    ["Where", str(data.platform) || str(data.location)],
  ];
  const cta = link ? { label: "Join meeting", url: link } : { label: "View in DevelopWork", url: ctx.appUrl };
  return {
    html: layout(ctx, { eyebrow: "Meeting invitation", title, bodyHtml: body ? paragraphs(body) : "", details, cta }),
    text: textVersion(`Meeting invitation: ${title}`, body, details, cta.url, ctx),
  };
}

export function buildMessage(ctx: EmailContext, data: Data, subject: string): BuiltEmail {
  const title = str(data.title) || subject || "Message";
  const body = str(data.message) || str(data.body);
  const cta = { label: "Open DevelopWork", url: ctx.appUrl };
  return {
    html: layout(ctx, { eyebrow: `Message from ${ctx.senderName}`, title, bodyHtml: body ? paragraphs(body) : "", cta }),
    text: textVersion(title, body, [], cta.url, ctx),
  };
}
