/**
 * <ImageControl> — WP Media Library image picker storing { id, url } (WEAVE-WP-08, D-11/OQ2).
 *
 * The live Media Library modal is a WP runtime feature absent under jsdom, so the
 * `@wordpress/media-utils` `MediaUpload` is the alias-stubbed one (see __mocks__/wordpress.ts):
 * it renders `render({ open })` AND a hidden `data-testid="media-select"` trigger that fires the
 * consumer's `onSelect` with MEDIA_UPLOAD_FAKE_MEDIA ({ id: 9, url: 'https://x/b.jpg' }). These
 * tests assert the value contract: select → onChange({ id, url }); remove → onChange({ id:null, url:'' }).
 */

import type { WeaveInput } from '@weave/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageControl } from '../form/image-control';

afterEach(cleanup);

const noop = () => {};

const imageInput: WeaveInput = { type: 'image', name: 'hero', label: 'Hero Image' } as WeaveInput;

describe('ImageControl — empty value', () => {
  it("renders 'Select Image', no preview img, no Remove", () => {
    const { container } = render(
      <ImageControl input={imageInput} value={{ id: null, url: '' }} onChange={noop} />,
    );
    expect(screen.getByText('Select Image')).toBeInTheDocument();
    expect(screen.queryByText('Remove')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('treats undefined value the same as cleared', () => {
    render(<ImageControl input={imageInput} value={undefined} onChange={noop} />);
    expect(screen.getByText('Select Image')).toBeInTheDocument();
    expect(screen.queryByText('Replace Image')).toBeNull();
  });

  it('wraps the control in a BaseControl carrying input.label', () => {
    const { container } = render(
      <ImageControl input={imageInput} value={{ id: null, url: '' }} onChange={noop} />,
    );
    expect(
      container.querySelector('[data-wp-control="BaseControl"][data-label="Hero Image"]'),
    ).not.toBeNull();
  });
});

describe('ImageControl — populated value', () => {
  const value = { id: 7, url: 'https://x/a.jpg' };

  it("renders a preview img, 'Replace Image', and 'Remove'", () => {
    const { container } = render(
      <ImageControl input={imageInput} value={value} onChange={noop} />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://x/a.jpg');
    expect(screen.getByText('Replace Image')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.queryByText('Select Image')).toBeNull();
  });
});

describe('ImageControl — value contract', () => {
  it('select → onChange({ id, url }) with the chosen media', () => {
    const onChange = vi.fn();
    render(<ImageControl input={imageInput} value={{ id: null, url: '' }} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('media-select'));
    expect(onChange).toHaveBeenCalledWith({ id: 9, url: 'https://x/b.jpg' });
  });

  it("Remove → onChange({ id: null, url: '' })", () => {
    const onChange = vi.fn();
    render(
      <ImageControl
        input={imageInput}
        value={{ id: 7, url: 'https://x/a.jpg' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('Remove'));
    expect(onChange).toHaveBeenCalledWith({ id: null, url: '' });
  });
});
