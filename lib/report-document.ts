import type { EventReportSummary } from "@/lib/data-reports";
import type { EventTemplateConfig } from "@/lib/eventTemplates";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { slugify } from "@/lib/utils";

type ReportEvent = {
  id: string;
  name: string;
  event_type: string;
};

type ReportWorkspace = {
  churchName: string;
  workspaceLabel: string;
  workspaceType: "church" | "ministry";
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function countRows(rows: Record<string, number>, labelForKey?: (key: string) => string) {
  const entries = Object.entries(rows);

  if (!entries.length) {
    return `<p class="muted">No data recorded yet.</p>`;
  }

  return `
    <table>
      <tbody>
        ${entries.map(([key, count]) => `
          <tr>
            <td>${escapeHtml(labelForKey ? labelForKey(key) : key)}</td>
            <td class="count">${count}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export function buildEventReportDocument({
  event,
  summary,
  template,
  workspace,
  generatedAt = new Date()
}: {
  event: ReportEvent;
  summary: EventReportSummary;
  template: EventTemplateConfig;
  workspace: ReportWorkspace;
  generatedAt?: Date;
}) {
  const generatedLabel = generatedAt.toLocaleString("en-ZA", {
    dateStyle: "long",
    timeStyle: "short"
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(event.name)} report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 20px; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    h3 { font-size: 16px; margin-bottom: 4px; }
    .muted { color: #6b7280; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 18px; }
    .metric { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
    .metric strong { display: block; font-size: 24px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    td, th { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    .count { text-align: right; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${escapeHtml(event.name)} detailed report</h1>
  <p class="muted">${escapeHtml(workspace.workspaceLabel)} report for ${escapeHtml(workspace.churchName)} · Generated ${escapeHtml(generatedLabel)}</p>
  <p>${escapeHtml(template.description)}</p>

  <h2>Summary</h2>
  <div class="summary">
    <div class="metric"><span>Total contacts</span><strong>${summary.total_contacts}</strong></div>
    <div class="metric"><span>Followed up</span><strong>${summary.followed_up_count}</strong></div>
    <div class="metric"><span>Bible study requests</span><strong>${summary.bible_study_count}</strong></div>
    <div class="metric"><span>Prayer and high priority care</span><strong>${summary.prayer_count + summary.high_priority_count}</strong></div>
    <div class="metric"><span>Baptismal requests</span><strong>${summary.baptism_count}</strong></div>
    <div class="metric"><span>Follow-up records</span><strong>${summary.follow_up_count}</strong></div>
  </div>

  <h2>Recommended focus areas</h2>
  <ul>
    ${template.reportSections.map((section) => {
      const value = section.metric
        ? summary[section.metric]
        : section.interest
          ? summary.interest_counts[section.interest] ?? 0
          : null;
      return `<li><strong>${escapeHtml(section.label)}${value !== null ? ` (${value})` : ""}:</strong> ${escapeHtml(section.description)}</li>`;
    }).join("")}
  </ul>

  <h2>Status breakdown</h2>
  ${countRows(summary.status_counts, (status) => statusLabels[status as FollowUpStatus] ?? status)}

  <h2>Interest breakdown</h2>
  ${countRows(summary.interest_counts, (interest) => interestLabels[interest as Interest] ?? interest)}

  <h2>Topic breakdown</h2>
  ${countRows(summary.topic_counts)}

  <h2>Custom form answers</h2>
  ${summary.form_answer_counts.length
    ? `<table><tbody>${summary.form_answer_counts.map((answer) => `
      <tr>
        <td>${escapeHtml(answer.question_label)}<br /><span class="muted">${escapeHtml(answer.question_name)}</span></td>
        <td class="count">${answer.count}</td>
      </tr>
    `).join("")}</tbody></table>`
    : `<p class="muted">No custom form answer data recorded yet.</p>`}

  <h2>Next-step interpretation prompt</h2>
  <p>Use the in-app AI assistant on this report page to interpret what should happen next based on these metrics.</p>
</body>
</html>`;
}

export function wordDocumentResponse(eventName: string, html: string) {
  const date = new Date().toISOString().split("T")[0];
  const fileName = `${slugify(eventName)}-${date}-report.doc`;

  return new Response(`\uFEFF${html}`, {
    headers: {
      "content-type": "application/msword; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`
    }
  });
}
