import React from 'react';
import { DryormIcon } from '../icons';

function AboutPage() {
  return (
    <div className="h-full overflow-auto bg-theme-page">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <DryormIcon size={48} className="text-django-primary" />
          <h1 className="text-3xl font-bold text-theme-text">About DryORM</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-theme-text-secondary mb-6">
            DryORM is an interactive playground for experimenting with Django ORM queries.
            Write Python code, execute it against real databases, and see the generated SQL queries.
          </p>

          <h2 className="text-xl font-semibold text-theme-text mt-8 mb-4">Features</h2>
          <ul className="list-disc list-inside text-theme-text-secondary space-y-2">
            <li>Write and execute Django ORM code in real-time</li>
            <li>See generated SQL queries with syntax highlighting</li>
            <li>Test against multiple database backends (SQLite, PostgreSQL, MySQL)</li>
            <li>Try different Django versions and even PR branches</li>
            <li>Share your code snippets with others</li>
            <li>Learn through guided journeys</li>
          </ul>

          <h2 className="text-xl font-semibold text-theme-text mt-8 mb-4">How to Use</h2>
          <ol className="list-decimal list-inside text-theme-text-secondary space-y-2">
            <li>Write your Django models and queries in the editor</li>
            <li>Press <kbd className="px-2 py-1 bg-theme-surface rounded text-xs font-mono">Cmd+Enter</kbd> to execute</li>
            <li>View the output and generated SQL queries on the right</li>
            <li>Share your snippet using the share button</li>
          </ol>

          <h2 className="text-xl font-semibold text-theme-text mt-8 mb-4">Links</h2>
          <ul className="list-disc list-inside text-theme-text-secondary space-y-2">
            <li>
              <a href="https://github.com" className="text-django-secondary hover:underline" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
            </li>
            <li>
              <a href="https://docs.djangoproject.com/" className="text-django-secondary hover:underline" target="_blank" rel="noopener noreferrer">
                Django Documentation
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
