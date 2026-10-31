import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./footer-section.css";

/**
 * Site footer, adapted for Mobility from 21st.dev "footer-section".
 *
 * Changes from the original:
 * - No shadcn/radix/lucide: plain elements and CSS, styled like the nav bar's frosted glass.
 * - Content comes from props; the Contact, Follow and newsletter blocks render only when they have
 *   real details (the original's sample address, phone, email and social links are not used).
 * - No dark-mode switch (the site has no dark theme) and no "Cookie settings" (no cookie banner).
 * - 18px text, 56px tap targets, real router links.
 */
export type FooterLink = { label: string; to: string };

export type FooterSectionProps = {
  brand: string;
  tagline: string;
  note?: ReactNode;
  links: FooterLink[];
  contact?: { email?: string; phone?: string; addressLines?: string[] };
  social?: { label: string; href: string }[];
  newsletterUrl?: string;
  legal: FooterLink[];
  copyright: string;
};

export function FooterSection({ brand, tagline, note, links, contact, social, newsletterUrl, legal, copyright }: FooterSectionProps) {
  const hasContact = Boolean(contact && (contact.email || contact.phone || contact.addressLines?.length));
  const hasSocial = Boolean(social && social.length);
  return (
    <footer className="fs">
      <div className="fs__inner">
        <div className="fs__grid">
          <div className="fs__about">
            <p className="fs__brand">{brand}</p>
            <p className="fs__tagline">{tagline}</p>
            {note ? <p className="fs__note">{note}</p> : null}
            {newsletterUrl ? (
              <a className="fs__pill" href={newsletterUrl} target="_blank" rel="noopener noreferrer">
                Join the newsletter
              </a>
            ) : null}
          </div>

          <nav className="fs__col" aria-label="Quick links">
            <h2 className="fs__h">Quick links</h2>
            <ul>
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="fs__link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {hasContact ? (
            <div className="fs__col">
              <h2 className="fs__h">Contact us</h2>
              <address className="fs__address">
                {contact?.addressLines?.map((line) => <p key={line}>{line}</p>)}
                {contact?.phone ? (
                  <a className="fs__link" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
                    {contact.phone}
                  </a>
                ) : null}
                {contact?.email ? (
                  <a className="fs__link" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                ) : null}
              </address>
            </div>
          ) : null}

          {hasSocial ? (
            <div className="fs__col">
              <h2 className="fs__h">Follow us</h2>
              <ul className="fs__social">
                {social!.map((s) => (
                  <li key={s.href}>
                    <a className="fs__pill" href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="fs__bottom">
          <p className="fs__copy">{copyright}</p>
          <nav aria-label="Legal" className="fs__legal">
            {legal.map((l) => (
              <Link key={l.to} to={l.to} className="fs__link">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
