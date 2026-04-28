import type { Interest } from "@/lib/constants";

type MessageContact = {
  name: string;
  phone: string;
  interests: Interest[];
  churchName?: string | null;
  eventName?: string | null;
};

export function generateMessage(contact: MessageContact) {
  const firstName = contact.name.trim().split(/\s+/)[0] || "there";
  const churchName = contact.churchName || "our church";
  const eventLine = contact.eventName ? ` after ${contact.eventName}` : "";

  if (contact.interests.includes("pastoral_visit")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You mentioned that you would appreciate a pastoral visit. Would it be alright if one of our pastoral team contacts you to find a suitable time?`;
  }

  if (contact.interests.includes("baptism")) {
    return `Good day ${firstName}, thank you for reaching out to ${churchName}${eventLine}. We saw your interest in baptism and would be glad to listen, answer questions, and support you at your pace. Would a short conversation this week be okay?`;
  }

  if (contact.interests.includes("prayer")) {
    return `Good day ${firstName}, thank you for trusting ${churchName}${eventLine}. We received your prayer request and would be honoured to pray with you. Would you like someone from our prayer team to check in with you?`;
  }

  if (contact.interests.includes("bible_study")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You mentioned an interest in Bible study. Would it be okay if one of our Bible workers contacts you and shares the available study options?`;
  }

  if (contact.interests.includes("health")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You showed interest in health resources. Would you like us to send a simple health resource and let you know about the next health program?`;
  }

  if (contact.interests.includes("cooking_class")) {
    return `Good day ${firstName}, thank you for connecting with ${churchName}${eventLine}. You selected cooking class updates. Would you like us to send details when the next healthy cooking session is scheduled?`;
  }

  return `Good day ${firstName}, thank you for visiting ${churchName}${eventLine}. We are grateful you connected with us. Would it be okay if one of our team members follows up with you this week?`;
}

export function waLink(phone: string, message: string) {
  let digits = phone.replace(/[^0-9]/g, "");

  if (digits.startsWith("0")) {
    digits = `27${digits.slice(1)}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
