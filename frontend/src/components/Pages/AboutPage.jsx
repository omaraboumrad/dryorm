import React from 'react';
import { DryormIcon } from '../icons';

function AboutPage() {
  return (
    <div className="h-full overflow-auto bg-theme-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <DryormIcon size={48} className="text-django-primary" />
          <h1 className="text-3xl font-bold text-theme-text">About DryORM</h1>
        </div>

        {/* Disclaimer */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Disclaimer</h2>
          <div className="text-theme-text-secondary space-y-2">
            <p>Dry ORM is not associated with the Django Software Foundation.</p>
            <p>
              Django is a{' '}
              <a className="text-django-secondary hover:underline" href="https://www.djangoproject.com/trademarks/" target="_blank" rel="noopener noreferrer">
                registered trademark
              </a>{' '}
              of the{' '}
              <a className="text-django-secondary hover:underline" href="https://www.djangoproject.com/foundation/" target="_blank" rel="noopener noreferrer">
                Django Software Foundation
              </a>.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-theme-text border-b border-theme-border pb-2 mb-4"># Intro</h2>
          <div className="text-theme-text-secondary space-y-4">
            <p>
              DryORM allows you to run Django ORM code against supported Databases (with experimental support for SQLAlchemy and Prisma). The technologies used to power this webapp are:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-theme-text">ORMs & Query Builders:</strong>{' '}
                <a className="text-django-secondary hover:underline" href="https://www.djangoproject.com" target="_blank" rel="noopener noreferrer">Django ORM</a> /{' '}
                <a className="text-django-secondary hover:underline" href="https://www.sqlalchemy.org/" target="_blank" rel="noopener noreferrer">SQLAlchemy</a> (experimental) /{' '}
                <a className="text-django-secondary hover:underline" href="https://www.prisma.io/" target="_blank" rel="noopener noreferrer">Prisma</a> (experimental)
              </li>
              <li>
                <strong className="text-theme-text">Frameworks & Libraries:</strong>{' '}
                <a className="text-django-secondary hover:underline" href="https://www.djangoproject.com" target="_blank" rel="noopener noreferrer">Django</a>
              </li>
              <li>
                <strong className="text-theme-text">DB / Broker:</strong> SQLite / Postgres / MariaDB / Redis
              </li>
              <li>
                <strong className="text-theme-text">Infra:</strong> Docker / Compose
              </li>
              <li>
                <strong className="text-theme-text">Frontend:</strong> React / Tailwind / CodeMirror
              </li>
            </ul>
            <p>
              The project is built primarily to provide{' '}
              <a className="text-django-secondary hover:underline" href="https://discord.com/invite/xcRH6mN4fa" target="_blank" rel="noopener noreferrer">
                Django's Discord Community
              </a>{' '}
              Staff with a medium to assist users with their ORM questions rather quickly.
              The implementation is in fact framework-agnostic (as can be seen by the experimental support), however Django will remain the primary purpose for the foreseeable future.
            </p>
            <p>
              Since I'm not forcing anyone to login, there are several safeguards in place. Nevertheless, I urge you not to cause harm. The limitations are as follows:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Rate limits</li>
              <li>10 concurrent executions</li>
              <li>10s timeout</li>
              <li>75MB limit for Django/SQLAlchemy and 150MB for Prisma</li>
              <li>No network</li>
            </ul>
            <p>Thank you to everyone that has helped test and provide feedback on the project, notably the awesome Django Discord Staff!</p>
            <p>
              <a className="font-bold text-django-secondary hover:underline" href="https://xterm.info" target="_blank" rel="noopener noreferrer">Xterm</a>
            </p>
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="text-xl font-semibold text-theme-text border-b border-t border-theme-border py-2 mb-4"># Changelog</h2>
          <div className="space-y-4">
            <ChangelogEntry date="December 12th, 2025">
              <li>Engine - adds support for running Django Branches, Tags and PRs from GitHub <a className="text-django-secondary hover:underline" href="/run-against-pr-20462/run">(Example)</a></li>
            </ChangelogEntry>

            <ChangelogEntry date="December 8th, 2025">
              <li>Engine - adds support for PostGIS</li>
              <li>Engine - adds Factory Boy support <a className="text-django-secondary hover:underline" href="/j/dryorm-features#factory-boy-test-data">(Example)</a></li>
              <li>Engine - adds <code className="bg-theme-surface px-1 rounded text-sm">_do_not_log()</code> decorator <a className="text-django-secondary hover:underline" href="/do-not-log-queries/run">(Example)</a></li>
            </ChangelogEntry>

            <ChangelogEntry date="December 6th, 2025">
              <li>Engine - adds support for Django 6.0 (Default still 5.2)</li>
            </ChangelogEntry>

            <ChangelogEntry date="November 25th, 2025">
              <li>Engine - templates available for different executors</li>
            </ChangelogEntry>

            <ChangelogEntry date="November 24th, 2025">
              <li>Engine - adds support for Prisma <a className="text-django-secondary hover:underline" href="/prisma-example/run">(Example)</a></li>
              <li>Engine - adds support for SQLAlchemy <a className="text-django-secondary hover:underline" href="/sqlalchemy-example/run">(Example)</a></li>
            </ChangelogEntry>

            <ChangelogEntry date="November 11th, 2025">
              <li>Engine - massive slimming of docker images</li>
              <li>Engine - adds support for multiple django versions</li>
            </ChangelogEntry>

            <ChangelogEntry date="November 10th, 2025">
              <li>Engine - converts websockets flow to standard flow</li>
            </ChangelogEntry>

            <ChangelogEntry date="October 19th, 2025">
              <li>UI - toggle hover query to template on alt key</li>
            </ChangelogEntry>

            <ChangelogEntry date="October 18th, 2025">
              <li>UI - adds similarity check on hover</li>
            </ChangelogEntry>

            <ChangelogEntry date="October 17th, 2025">
              <li>UI - fixes the excessive horizontal scrolling</li>
              <li>UI - adds ctrl+cmd+enter to run without cache</li>
            </ChangelogEntry>

            <ChangelogEntry date="September 30th, 2025">
              <li>UI - shows sql query popup on hover</li>
            </ChangelogEntry>

            <ChangelogEntry date="August 24th, 2025">
              <li>Engine - interpolates the actual values in queries</li>
              <li>UI - highlights query when line is selected</li>
              <li>UI - adds support for line tracking</li>
            </ChangelogEntry>

            <ChangelogEntry date="August 23rd, 2025">
              <li>Engine - upgrades django version to 5.2.5</li>
            </ChangelogEntry>

            <ChangelogEntry date="August 14th, 2025">
              <li>Engine & UI - adds experimental journeys feature</li>
              <li>Engine - executor default app renamed to app</li>
            </ChangelogEntry>

            <ChangelogEntry date="August 8th, 2025">
              <li>UI - queries are not collapsed by default</li>
            </ChangelogEntry>

            <ChangelogEntry date="July 3rd, 2025">
              <li>Engine - adds support for /run as well as ?run</li>
            </ChangelogEntry>

            <ChangelogEntry date="June 6th, 2025">
              <li>UI - adds support for public feed live search</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 24th, 2025">
              <li>UI - massive overhaul to the interface</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 16th, 2025">
              <li>UI - smaller screen size improvements</li>
              <li>UI - makes both columns scrollable</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 15th, 2025">
              <li>Engine - now sends the DDL from migrations</li>
              <li>UI - adds filter counts</li>
              <li>UI - browse page is now slimmer</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 13th, 2025">
              <li>Engine & UI - added experimental template rendering <a className="text-django-secondary hover:underline" href="/template-render?run">(Example)</a></li>
              <li>UI - resets url token if template is changed</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 12th, 2025">
              <li>UI - adds query filters</li>
              <li>UI - returned tables are now collapsed by default</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 11th, 2025">
              <li>Engine - now supports postgres <a className="text-django-secondary hover:underline" href="/example-postgres?run">(Example)</a></li>
              <li>Engine - now supports mariadb</li>
              <li>Engine - can now ignore cache on demand</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 10th, 2025">
              <li>Engine & UI - generates a model relationship diagram <a className="text-django-secondary hover:underline" href="/comprehensive?run">(Example)</a></li>
            </ChangelogEntry>

            <ChangelogEntry date="May 9th, 2025">
              <li>UI - adds autorun support <a className="text-django-secondary hover:underline" href="/?run">(Example)</a></li>
              <li>UI - Cmd+Enter and Ctrl+Enter now run the code</li>
              <li>UI - rendered tables are now different color</li>
              <li>UI - code editor gets focused by default and on template select</li>
              <li>UI - adds output and queries copy to clipboard</li>
              <li>UI - basic default template is now selected</li>
              <li>UI - moved loader to code section title</li>
              <li>UI - removed job indicator</li>
              <li>UI - about page now has changelog</li>
              <li>UI - about page is now standalone</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 8th, 2025">
              <li>Engine - execution is now exponentially faster</li>
              <li>Engine - result is now cached, driven by the code hash</li>
              <li>Engine - increased concurrent workers to 10</li>
              <li>Engine - upgraded executors to Django 5.2.1</li>
              <li>UI - improved contrast on some elements</li>
              <li>UI - queries are now more human readable</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 7th, 2025">
              <li>UI - adds footer with disclaimer</li>
              <li>UI - adds sql time per query</li>
              <li>UI - highlight keywords in sql</li>
              <li>UI - changes the code editor colors to match theme</li>
            </ChangelogEntry>

            <ChangelogEntry date="May 6th, 2025">
              <li>Initial release</li>
            </ChangelogEntry>
          </div>
        </section>
      </div>
    </div>
  );
}

function ChangelogEntry({ date, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-44 flex-shrink-0 font-semibold text-theme-text">{date}</div>
      <ul className="text-theme-text-secondary list-disc list-inside space-y-1">
        {children}
      </ul>
    </div>
  );
}

export default AboutPage;
