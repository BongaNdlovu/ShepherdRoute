import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/app/brand-logo";
import { ExternalBrandImage } from "@/components/app/external-brand-image";
import { SmartIntakeFlow } from "@/components/public/smart-intake-flow";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { getEffectiveBrandingConfig, getEffectiveFormConfig, getEffectivePublicInfo, replacePlaceholders } from "@/lib/eventCustomization";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return {
    title: `${event.name} | Quick Intake`,
    description: "Choose how the team can help and submit your details."
  };
}

export default async function PublicIntakePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const event = await getPublicEvent(slug);
  const template = getEventTemplate(event.event_type);
  const publicInfo = getEffectivePublicInfo(event, template);
  const branding = getEffectiveBrandingConfig(event);
  const formConfig = getEffectiveFormConfig(event, template);
  const consentText = replacePlaceholders(publicInfo.consent_text, { churchName: event.church_name });
  const thankYouMessage = replacePlaceholders(publicInfo.thank_you_message, { churchName: event.church_name, eventName: event.name || "this event" });

  return (
    <main
      className="mobile-safe-container min-h-screen py-6 bg-[radial-gradient(circle_at_top_left,var(--event-primary,#fde68a)_0,var(--event-accent,#f7f3eb)_34%,#f8fafc_100%)]"
      style={{ "--event-primary": branding.primary_color, "--event-accent": branding.accent_color } as CSSProperties}
    >
      <section className="mobile-safe-container mx-auto max-w-xl px-5">
        {branding.cover_image_url ? (
          <ExternalBrandImage src={branding.cover_image_url} alt={`${event.name} cover`} className="h-36 w-full rounded-2xl object-cover" width={900} height={320} loading="eager" />
        ) : null}

        <header className="py-6 text-center">
          {publicInfo.show_logo && branding.logo_url ? (
            <ExternalBrandImage src={branding.logo_url} alt={`${event.church_name} logo`} className="mx-auto h-20 w-auto object-contain" width={160} height={80} />
          ) : publicInfo.show_logo ? (
            <BrandLogo className="mx-auto h-20 w-auto object-contain" priority />
          ) : null}
          {publicInfo.show_church_name ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{event.church_name}</p> : null}
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground">How can we help?</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose one option, add your details, and the right team can follow up.</p>
        </header>

        {query.submitted ? (
          <div className="rounded-2xl border border-success/20 bg-success/10 p-6 text-center text-success">
            <CheckCircle2 className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-2xl font-semibold">{publicInfo.thank_you_heading}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6">{thankYouMessage}</p>
          </div>
        ) : formConfig.intake_enabled ? (
          <SmartIntakeFlow
            slug={event.slug}
            categories={formConfig.intake_categories}
            consentText={consentText}
            error={query.error}
          />
        ) : (
          <div className="rounded-2xl border bg-white p-5 text-center">
            <p className="text-sm text-muted-foreground">Quick intake is not enabled for this event.</p>
            <Link href={`/e/${event.slug}`} className="mt-3 inline-block text-sm font-semibold underline">Open the full form</Link>
          </div>
        )}

        <footer className="mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:flex-row">
          <span>Copyright (c) {new Date().getFullYear()} ShepherdRoute.</span>
          <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
        </footer>
      </section>
    </main>
  );
}
