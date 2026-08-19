import React from 'react';
import { DryormIcon } from '../icons';

function PrivacyPage() {
  return (
    <div className="h-full overflow-auto bg-theme-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <DryormIcon size={48} className="text-django-primary" />
          <h1 className="text-3xl font-bold text-theme-text">Privacy</h1>
        </div>

        <p className="text-theme-text-secondary mb-8">
          DryORM has no accounts and no ads, and nothing here is sold to anyone. It does use
          Google Analytics, and running a code execution service involves storing a fair bit
          besides, so here is exactly what it is.
        </p>

        {/* Code you run */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Code you run</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>
              When you run a snippet, your code is sent to the server and executed inside a
              short-lived, network-isolated container which is destroyed afterwards.
            </p>
            <p>
              Results are cached server-side, keyed by a hash of your code, so that an identical
              snippet does not need to be executed twice.
            </p>
            <p className="font-semibold text-theme-text">
              Please do not paste real credentials, personal data or anything else sensitive into
              the editor.
            </p>
          </div>
        </section>

        {/* Saved snippets */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Saved snippets</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>Saving a snippet stores its name, code, chosen database, ORM version and creation time.</p>
            <p>
              Snippets are public by default and are listed on the{' '}
              <a className="text-django-secondary hover:underline" href="/browse">browse page</a>.
              Marking a snippet as private keeps it off that list, but it is not encrypted and
              anyone with the URL can still open it.
            </p>
            <p>Snippets are kept indefinitely unless you ask me to remove one.</p>
          </div>
        </section>

        {/* Cookies and local storage */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Cookies &amp; local storage</h2>
          <div className="text-theme-text-secondary space-y-2">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-theme-text">Session cookie:</strong> a standard Django
                session cookie. It exists only so the site can tell that a snippet belongs to you
                and let you edit it.
              </li>
              <li>
                <strong className="text-theme-text">Google Analytics cookies:</strong> see the
                analytics section below.
              </li>
              <li>
                <strong className="text-theme-text">Local storage:</strong> your theme, zen mode
                and editor mode preferences. These never leave your browser.
              </li>
            </ul>
          </div>
        </section>

        {/* Analytics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Analytics</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>
              This site loads{' '}
              <a className="text-django-secondary hover:underline" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                Google Analytics
              </a>{' '}
              on every page, so I can see roughly how many people use DryORM and which parts get
              used. It sets its own cookies and reports the usual data to Google: pages visited,
              referrer, approximate location, device and browser.
            </p>
            <p>
              It runs in the page, so a content blocker or a browser that blocks third party
              scripts will stop it. Nothing else on the site depends on it, so blocking it does
              not break anything.
            </p>
            <p>
              The code you write is <strong className="text-theme-text">not</strong> sent to Google
              Analytics.
            </p>
          </div>
        </section>

        {/* Logs and monitoring */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Logs &amp; monitoring</h2>
          <div className="text-theme-text-secondary space-y-2">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-theme-text">Web server logs:</strong> ordinary access logs
                including IP address, timestamp and requested URL. Used for abuse prevention,
                rate limiting and debugging.
              </li>
              <li>
                <strong className="text-theme-text">Operational events:</strong> a self-hosted
                dashboard records execution and snippet events, including the snippet code, the
                selected database and the session identifier, so I can see failures and keep the
                service healthy. It is not shared with anyone.
              </li>
              <li>
                <strong className="text-theme-text">Error reporting:</strong> unhandled errors are
                sent to{' '}
                <a className="text-django-secondary hover:underline" href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">
                  Sentry
                </a>{' '}
                to help me fix crashes. These reports are configured to include request context
                such as your IP address.
              </li>
            </ul>
            <p>
              Google Analytics and Sentry are the only third parties that receive any data. The
              operational dashboard is self-hosted on my own infrastructure.
            </p>
          </div>
        </section>

        {/* GitHub refs */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># GitHub refs</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>
              Running against a Django branch, tag or pull request makes a request from the server
              to the GitHub API to look up that ref. GitHub sees the server, not you, and no
              information about you is included.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Removal &amp; contact</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>
              If you want a snippet deleted, or you have any question about the above, reach out
              via{' '}
              <a className="text-django-secondary hover:underline" href="https://xterm.info" target="_blank" rel="noopener noreferrer">
                xterm.info
              </a>{' '}
              or the{' '}
              <a className="text-django-secondary hover:underline" href="https://discord.com/invite/xcRH6mN4fa" target="_blank" rel="noopener noreferrer">
                Django Discord
              </a>.
            </p>
            <p className="text-sm">Last updated: August 19th, 2026</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
