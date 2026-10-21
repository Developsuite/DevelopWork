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
      const html = esc(p).replace(/\*\*(.+?)\*\*/g, "<strong style=\"color:#0F172A;font-weight:600;\">$1</strong>").replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${html}</p>`;
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

// Deliberately lean (no images, one link, no marketing footer) so Gmail files it as a
// personal message in Primary rather than Promotions.
function layout(ctx: EmailContext, o: LayoutOptions): string {
  const details = (o.details || []).filter(([, v]) => v);
  const detailRows = details
    .map(
      ([label, value], i) => `
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:38%;${i ? "border-top:1px solid #EDF0F5;" : ""}">${esc(label)}</td>
          <td style="padding:12px 16px;font-size:14px;color:#0F172A;font-weight:600;${i ? "border-top:1px solid #EDF0F5;" : ""}">${esc(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:#F3F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E5E8EF;border-radius:16px;">
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#0055FE;letter-spacing:-0.2px;">DevelopWork</p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#6B7280;">${esc(o.eyebrow)}</p>
          <h1 style="margin:0 0 20px;font-size:22px;line-height:1.35;font-weight:700;color:#0F172A;">${esc(o.title)}</h1>
          ${o.bodyHtml || ""}
          ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;background:#F8F9FC;border:1px solid #EDF0F5;border-radius:12px;border-collapse:separate;">${detailRows}</table>` : ""}
          ${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 26px;"><tr><td style="background:#0055FE;border-radius:10px;"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${esc(o.cta.label)}</a></td></tr></table>` : ""}
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:#EDF0F5;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:18px 40px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <div style="width:34px;height:34px;border-radius:50%;background:#EEF3FF;color:#0055FE;font-size:13px;font-weight:700;line-height:34px;text-align:center;">${esc(initials(ctx.senderName))}</div>
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${esc(ctx.senderName)}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#6B7280;">${esc(ctx.senderTitle)}</p>
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
