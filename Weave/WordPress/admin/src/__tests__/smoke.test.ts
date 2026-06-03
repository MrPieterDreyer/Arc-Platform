import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
// Aliased to ./__mocks__/wordpress.ts by vitest.config.ts (every @wordpress/* resolves there).
import { Button, Notice } from '@wordpress/components';

/**
 * Wave-0 smoke test: proves the weave-admin harness boots — jsdom is the environment,
 * the `@wordpress/*` alias resolves to the stub, and a stub component renders to the DOM.
 * This is the green test bed Plans 06–08 (store + form-mapping) build on.
 */
describe('weave-admin harness', () => {
  it('renders a stubbed @wordpress/components Button into jsdom', () => {
    render(createElement(Button, null, 'Save Page'));
    const btn = screen.getByRole('button', { name: 'Save Page' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-wp-control', 'Button');
  });

  it('renders a stubbed Notice carrying its status', () => {
    render(createElement(Notice, { status: 'success', children: 'Page saved.' }));
    const notice = screen.getByText('Page saved.');
    expect(notice).toHaveAttribute('data-status', 'success');
  });
});
