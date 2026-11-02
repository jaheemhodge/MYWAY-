import StickerSlapFooter from "@/components/ui/sticker-slap-footer";
import { FONT_SANS, SIGN_UP_HREF, SUPPORT_EMAIL } from "../content";

const NOTE = "*mobility is general movement guidance, not medical advice. if something hurts, stop and check with your doctor.";

export function LandingFooter() {
  return (
    <>
      {/*
        The footer prints its note inside the contact column, and that column only shows when there is
        an email (we have no chat link or socials). Until SUPPORT_EMAIL is filled in, show the note here
        so the disclaimer is never missing.
      */}
      {!SUPPORT_EMAIL && (
        <p className="landing-disclaimer">
          <span>{NOTE}</span>
        </p>
      )}
      <StickerSlapFooter
        className="landing-footer"
        wordmark="mobility"
        homeHref="/"
        navLabel="start"
        navHref={SIGN_UP_HREF}
        chatHref=""
        jobsLabel="pick your focus"
        jobs={[
          { title: "knees", href: SIGN_UP_HREF },
          { title: "lower back", href: SIGN_UP_HREF },
          { title: "hips & balance", href: SIGN_UP_HREF },
        ]}
        officeLabel="your 60 days"
        address={["one short session a day", "the next day unlocks when you finish"]}
        mapLabel="start day 1"
        mapHref={SIGN_UP_HREF}
        contactLabel="contact"
        email={SUPPORT_EMAIL}
        note={NOTE}
        socials={[]}
        stickers={["heart", "smiley", "daisy", { kind: "bubble", text: "day one" /* the sticker script has letters only, so "1" would drop out */ }, "burst"]}
        credits={[{ role: "made by", name: "jah brands llc" }]}
        paper="#F5F6F4"
        panel="#2E4250"
        ink="#0F1418"
        cream="#F5F6F4"
        accent="#C8925A"
        fontSans={FONT_SANS}
        height="90svh"
        wordmarkMaxHeight="44svh"
      />
    </>
  );
}
