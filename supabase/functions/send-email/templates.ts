type Data = Record<string, unknown>;

export interface EmailContext {
  appUrl: string;
  senderName: string;
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
  footerNote: string;
}

function layout(ctx: EmailContext, o: LayoutOptions): string {
  const details = (o.details || []).filter(([, v]) => v);
  const detailRows = details
    .map(
      ([label, value], i) => `
        <tr>
          <td style="padding:13px 18px;font-size:13px;color:#6B7280;width:38%;${i ? "border-top:1px solid #EDF0F5;" : ""}">${esc(label)}</td>
          <td style="padding:13px 18px;font-size:14px;color:#0F172A;font-weight:600;${i ? "border-top:1px solid #EDF0F5;" : ""}">${esc(value)}</td>
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
<body style="margin:0;padding:0;background:#F3F5F9;font-family:'Figtree',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F9;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><img src="${ctx.appUrl}/images/logo.png" width="30" height="30" alt="" style="display:block;border:0;width:30px;height:30px;"></td>
            <td style="vertical-align:middle;padding-left:8px;font-size:17px;font-weight:700;color:#0F172A;letter-spacing:-0.2px;">DevelopWork</td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#FFFFFF;border:1px solid #E5E8EF;border-radius:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 12px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:#0055FE;">${esc(o.eyebrow)}</p>
              <h1 style="margin:0 0 22px;font-size:22px;line-height:1.35;font-weight:700;color:#0F172A;letter-spacing:-0.3px;">${esc(o.title)}</h1>
              ${o.bodyHtml || ""}
              ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 24px;background:#F8F9FC;border:1px solid #EDF0F5;border-radius:12px;border-collapse:separate;">${detailRows}</table>` : ""}
              ${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td style="background:#0055FE;border-radius:10px;"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${esc(o.cta.label)} &rarr;</a></td></tr></table>` : ""}
            </td></tr>
            <tr><td style="padding:0 40px;"><div style="height:1px;background:#EDF0F5;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
            <tr><td style="padding:20px 40px 26px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;">
                  <div style="width:36px;height:36px;border-radius:50%;background:#EEF3FF;color:#0055FE;font-size:13px;font-weight:700;line-height:36px;text-align:center;">${esc(initials(ctx.senderName))}</div>
                </td>
                <td style="vertical-align:middle;padding-left:12px;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${esc(ctx.senderName)}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#6B7280;">Sent from your DevelopWork workspace</p>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 8px 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#8A93A3;">${esc(o.footerNote)}</p>
          <p style="margin:0;font-size:12px;color:#8A93A3;"><a href="${esc(ctx.appUrl)}" style="color:#8A93A3;text-decoration:underline;">Open DevelopWork</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function textVersion(title: string, body: string, details: Array<[string, string]>, link: string, sender: string): string {
  const lines = [title, "", body.trim()];
  const d = details.filter(([, v]) => v);
  if (d.length) lines.push("", ...d.map(([k, v]) => `${k}: ${v}`));
  lines.push("", `Open DevelopWork: ${link}`, "", `Sent by ${sender} via DevelopWork`);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

export function buildTaskAssigned(ctx: EmailContext, data: Data): BuiltEmail {
  const title = str(data.task_title) || str(data.title) || "New task";
  const body = str(data.message) || str(data.description);
  const details: Array<[string, string]> = [
    ["Priority", str(data.priority)],
    ["Due date", str(data.deadline)],
    ["Project", str(data.project)],
    ["Assigned by", str(data.assigned_by) || ctx.senderName],
  ];
  const cta = { label: "View task", url: `${ctx.appUrl}/employee/dashboard` };
  return {
    html: layout(ctx, {
      eyebrow: "New task assigned",
      title,
      bodyHtml: body ? paragraphs(body) : "",
      details,
      cta,
      footerNote: "You received this email because a task was assigned to you in DevelopWork.",
    }),
    text: textVersion(`New task assigned: ${title}`, body, details, cta.url, ctx.senderName),
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
    html: layout(ctx, {
      eyebrow: "Meeting invitation",
      title,
      bodyHtml: body ? paragraphs(body) : "",
      details,
      cta,
      footerNote: "You received this email because you were invited to a meeting in DevelopWork.",
    }),
    text: textVersion(`Meeting invitation: ${title}`, body, details, cta.url, ctx.senderName),
  };
}

export function buildMessage(ctx: EmailContext, data: Data, subject: string): BuiltEmail {
  const title = str(data.title) || subject || "Message";
  const body = str(data.message) || str(data.body);
  const cta = { label: "Open DevelopWork", url: ctx.appUrl };
  return {
    html: layout(ctx, {
      eyebrow: `Message from ${ctx.senderName}`,
      title,
      bodyHtml: body ? paragraphs(body) : "",
      cta,
      footerNote: "You received this email because you are a member of a DevelopWork workspace.",
    }),
    text: textVersion(title, body, [], cta.url, ctx.senderName),
  };
}
