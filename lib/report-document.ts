import type { EventReportDocumentContact, EventReportSummary } from "@/lib/data-reports";
import type { EventTemplateConfig } from "@/lib/eventTemplates";
import { interestLabels, statusLabels, type FollowUpStatus, type Interest } from "@/lib/constants";
import { slugify } from "@/lib/utils";

type ReportEvent = {
  id: string;
  name: string;
  event_type: string;
  starts_on?: string | null;
  location?: string | null;
  description?: string | null;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function formatAnswer(value: unknown) {
  if (Array.isArray(value)) return value.join("; ");
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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

function contactRows(contacts: EventReportDocumentContact[]) {
  if (!contacts.length) {
    return `<p class="muted">No contacts have been captured for this event yet.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Interests</th>
          <th>Status</th>
          <th>Assignee</th>
          <th>Captured</th>
        </tr>
      </thead>
      <tbody>
        ${contacts.map((contact) => {
          const interests = (contact.contact_interests ?? [])
            .map((item) => interestLabels[item.interest] ?? item.interest)
            .join("; ");
          const contactLines = [
            contact.phone,
            contact.email,
            contact.area,
            contact.best_time_to_contact ? `Best time: ${contact.best_time_to_contact}` : null,
            contact.do_not_contact ? "Do not contact" : null,
            contact.archived_at ? "Archived" : null
          ].filter(Boolean);

          return `
            <tr>
              <td><strong>${escapeHtml(contact.full_name)}</strong></td>
              <td>${contactLines.map(escapeHtml).join("<br />") || "<span class=\"muted\">Not supplied</span>"}</td>
              <td>${escapeHtml(interests || "None recorded")}</td>
              <td>${escapeHtml(statusLabels[contact.status as FollowUpStatus] ?? contact.status)}<br /><span class="muted">${escapeHtml(contact.urgency)} urgency</span></td>
              <td>${escapeHtml(contact.assigned_name ?? "Unassigned")}</td>
              <td>${escapeHtml(formatDateTime(contact.created_at))}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function followUpRows(contacts: EventReportDocumentContact[]) {
  const rows = contacts.flatMap((contact) =>
    contact.follow_ups.map((followUp) => ({ contact, followUp }))
  );

  if (!rows.length) {
    return `<p class="muted">No follow-up records have been logged yet.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Contact</th>
          <th>Status</th>
          <th>Owner</th>
          <th>Next action / notes</th>
          <th>Due / completed</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ contact, followUp }) => `
          <tr>
            <td>${escapeHtml(contact.full_name)}</td>
            <td>${escapeHtml(statusLabels[followUp.status] ?? followUp.status)}</td>
            <td>${escapeHtml(followUp.assigned_name ?? "Unassigned")}</td>
            <td>
              ${escapeHtml(followUp.next_action ?? "No next action recorded")}
              ${followUp.notes ? `<br /><span class="muted">${escapeHtml(followUp.notes)}</span>` : ""}
            </td>
            <td>
              ${followUp.due_at ? `Due ${escapeHtml(formatDateTime(followUp.due_at))}` : "No due date"}
              ${followUp.completed_at ? `<br />Completed ${escapeHtml(formatDateTime(followUp.completed_at))}` : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function prayerRows(contacts: EventReportDocumentContact[]) {
  const rows = contacts.flatMap((contact) =>
    contact.prayer_requests.map((request) => ({ contact, request }))
  );

  if (!rows.length) {
    return `<p class="muted">No prayer request details have been recorded for this event.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Contact</th>
          <th>Visibility</th>
          <th>Request</th>
          <th>Captured</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ contact, request }) => `
          <tr>
            <td>${escapeHtml(contact.full_name)}</td>
            <td>${escapeHtml(request.visibility)}</td>
            <td>${escapeHtml(request.request_text)}</td>
            <td>${escapeHtml(formatDateTime(request.created_at))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formAnswerRows(contacts: EventReportDocumentContact[]) {
  const rows = contacts.flatMap((contact) =>
    contact.form_answers.map((answer) => ({ contact, answer }))
  );

  if (!rows.length) {
    return `<p class="muted">No custom form answers have been recorded for this event.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Contact</th>
          <th>Question</th>
          <th>Answer</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ contact, answer }) => `
          <tr>
            <td>${escapeHtml(contact.full_name)}</td>
            <td>${escapeHtml(answer.question_label)}<br /><span class="muted">${escapeHtml(answer.question_name)}</span></td>
            <td>${escapeHtml(formatAnswer(answer.answer_display) || "Not answered")}</td>
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
  contacts,
  generatedAt = new Date()
}: {
  event: ReportEvent;
  summary: EventReportSummary;
  template: EventTemplateConfig;
  workspace: ReportWorkspace;
  contacts: EventReportDocumentContact[];
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
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; margin: 32px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    h2 { font-size: 20px; margin-top: 28px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    .muted { color: #6b7280; }
    .summary td { width: 33%; }
    .metric-label { color: #4b5563; font-size: 12px; text-transform: uppercase; }
    .metric-value { display: block; font-size: 24px; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; page-break-inside: auto; }
    td, th { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: bold; }
    .count { text-align: right; font-weight: bold; }
    .section-note { margin-top: 4px; color: #4b5563; }
  </style>
</head>
<body>
  <h1>${escapeHtml(event.name)} detailed report</h1>
  <p class="muted">${escapeHtml(workspace.workspaceLabel)} report for ${escapeHtml(workspace.churchName)} - Generated ${escapeHtml(generatedLabel)}</p>
  <p>${escapeHtml(template.description)}</p>

  <h2>Event Details</h2>
  <table>
    <tbody>
      <tr><th>Event type</th><td>${escapeHtml(template.name)}</td></tr>
      <tr><th>Date</th><td>${escapeHtml(formatDate(event.starts_on) || "Not set")}</td></tr>
      <tr><th>Location</th><td>${escapeHtml(event.location || "Not set")}</td></tr>
      <tr><th>Description</th><td>${escapeHtml(event.description || "No description recorded")}</td></tr>
    </tbody>
  </table>

  <h2>Summary</h2>
  <table class="summary">
    <tbody>
      <tr>
        <td><span class="metric-label">Total contacts</span><span class="metric-value">${summary.total_contacts}</span></td>
        <td><span class="metric-label">Followed up</span><span class="metric-value">${summary.followed_up_count}</span></td>
        <td><span class="metric-label">Follow-up records</span><span class="metric-value">${summary.follow_up_count}</span></td>
      </tr>
      <tr>
        <td><span class="metric-label">Bible study</span><span class="metric-value">${summary.bible_study_count}</span></td>
        <td><span class="metric-label">Prayer and high priority</span><span class="metric-value">${summary.prayer_count + summary.high_priority_count}</span></td>
        <td><span class="metric-label">Baptismal requests</span><span class="metric-value">${summary.baptism_count}</span></td>
      </tr>
    </tbody>
  </table>

  <h2>Recommended Focus Areas</h2>
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

  <h2>Status Breakdown</h2>
  ${countRows(summary.status_counts, (status) => statusLabels[status as FollowUpStatus] ?? status)}

  <h2>Interest Breakdown</h2>
  ${countRows(summary.interest_counts, (interest) => interestLabels[interest as Interest] ?? interest)}

  <h2>Topic Breakdown</h2>
  ${countRows(summary.topic_counts)}

  <h2>Custom Form Answer Summary</h2>
  ${summary.form_answer_counts.length
    ? `<table><tbody>${summary.form_answer_counts.map((answer) => `
      <tr>
        <td>${escapeHtml(answer.question_label)}<br /><span class="muted">${escapeHtml(answer.question_name)}</span></td>
        <td class="count">${answer.count}</td>
      </tr>
    `).join("")}</tbody></table>`
    : `<p class="muted">No custom form answer data recorded yet.</p>`}

  <h2>Contact Register</h2>
  <p class="section-note">Archived contacts are included for reporting history. Deleted contacts are excluded.</p>
  ${contactRows(contacts)}

  <h2>Follow-Up Details</h2>
  ${followUpRows(contacts)}

  <h2>Prayer Requests</h2>
  ${prayerRows(contacts)}

  <h2>Individual Form Answers</h2>
  ${formAnswerRows(contacts)}
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
