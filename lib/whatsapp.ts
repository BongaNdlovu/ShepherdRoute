import type { Interest } from "@/lib/constants";
import { getEventTemplate, type TemplateMessageKey } from "@/lib/eventTemplates";

type MessageContact = {
  name: string;
  phone: string | null;
  interests: Interest[];
  churchName?: string | null;
  eventName?: string | null;
  templateType?: string | null;
};

export function generateMessage(contact: MessageContact) {
  const firstName = contact.name.trim().split(/\s+/)[0] || "there";
  const churchName = contact.churchName || "our church";
  const eventLine = contact.eventName ? ` after ${contact.eventName}` : "";
  const eventName = contact.eventName || "the event";
  const template = contact.templateType ? getEventTemplate(contact.templateType) : null;
  const templateMessage = template
    ? chooseTemplateMessage(template.messageTemplates, contact.interests)
    : null;

  if (templateMessage) {
    return fillTemplate(templateMessage, { firstName, churchName, eventLine, eventName });
  }

  if (contact.interests.includes("pastoral_visit")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You mentioned that you would appreciate a pastoral visit. Would it be okay if one of our pastoral team members contacts you to find a suitable time?`;
  }

  if (contact.interests.includes("baptism")) {
    return `Good day ${firstName}, thank you for reaching out to ${churchName}${eventLine}. Thank you for sharing your baptism request. We would be honoured to connect you with a Bible worker who can walk with you through preparation. Would it also be helpful if we shared Bible study options with you?`;
  }

  if (contact.interests.includes("prayer")) {
    return `Good day ${firstName}, thank you for trusting ${churchName}${eventLine}. We have received your prayer request, and we will handle it with care. Would you like someone from our prayer team to check in with you?`;
  }

  if (contact.interests.includes("bible_study")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. We are glad you are interested in Bible study. Would it be okay if one of our Bible workers contacts you and shares the available study options?`;
  }

  if (contact.interests.includes("health")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You showed interest in health resources. Would you like us to send a simple resource and let you know about the next health program?`;
  }

  if (contact.interests.includes("cooking_class")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You selected cooking class updates. Would you like us to send details when the next healthy cooking session is planned?`;
  }

  return `Good day ${firstName}, thank you for visiting ${churchName}${eventLine}. We are grateful you connected with us. Would it be okay if one of our team members follows up with you this week?`;
}

export function normalizeWhatsappPhone(phone: string | null | undefined) {
  const digits = String(phone ?? "").replace(/[^0-9]/g, "");

  if (!digits) {
    return null;
  }

  const normalized = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;

  if (normalized.length < 8 || normalized.length > 15) {
    return null;
  }

  return normalized;
}

export function createWhatsappLink(phone: string | null | undefined, message = "") {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return `https://wa.me/${normalizedPhone}`;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(trimmedMessage)}`;
}

export function waLink(phone: string, message: string) {
  const link = createWhatsappLink(phone, message);

  if (!link) {
    throw new Error("Invalid WhatsApp phone number.");
  }

  return link;
}

function chooseTemplateMessage(
  templates: Partial<Record<TemplateMessageKey, string>>,
  interests: Interest[]
) {
  const priority: Interest[] = ["pastoral_visit", "baptism", "prayer", "bible_study", "health", "cooking_class", "youth"];
  const matchingKey = priority.find((interest) => interests.includes(interest) && templates[interest]);

  return matchingKey ? templates[matchingKey] : templates.default;
}

function fillTemplate(
  template: string,
  values: { firstName: string; churchName: string; eventLine: string; eventName: string }
) {
  return template
    .replaceAll("{firstName}", values.firstName)
    .replaceAll("{churchName}", values.churchName)
    .replaceAll("{eventLine}", values.eventLine)
    .replaceAll("{eventName}", values.eventName);
}
