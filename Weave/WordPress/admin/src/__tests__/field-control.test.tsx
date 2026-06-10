/**
 * <FieldControl> schema→widget mapping + condition gating (WEAVE-WP-07, UI-SPEC §Input-Type to
 * Control Mapping + §Condition evaluation).
 *
 * Renders each of the 15 WeaveInputTypes through the jsdom @wordpress/* stubs (each tagged with a
 * `data-wp-control` marker) and asserts the mapped control appears. Also proves: a falsy
 * `evaluateCondition` renders nothing; a truthy condition renders the control; an unknown type
 * fails soft to null; and onChange threads the new value up to the caller.
 */

import { type WeaveInput, type WeaveInputType, evaluateCondition } from '@weave-platform/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FieldControl } from '../form/field-control';

afterEach(cleanup);

const noop = () => {};

/** Build an input of a given type (configs supplied where the union member requires them). */
function inputOf(type: WeaveInputType): WeaveInput {
  switch (type) {
    case 'select':
      return {
        type: 'select',
        name: 'choice',
        label: 'Choice',
        configs: {
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      } as WeaveInput;
    case 'range':
      return {
        type: 'range',
        name: 'size',
        label: 'Size',
        configs: { min: 0, max: 10, step: 2 },
      } as WeaveInput;
    case 'repeater':
      return {
        type: 'repeater',
        name: 'items',
        label: 'Items',
        configs: { inputs: [] },
      } as WeaveInput;
    default:
      return { type, name: 'field', label: 'Field' } as WeaveInput;
  }
}

/** type → expected `data-wp-control` marker rendered by the stub (UI-SPEC mapping). */
const EXPECTED: Record<WeaveInputType, string> = {
  text: 'TextControl',
  url: 'TextControl',
  datetime: 'TextControl',
  'product-picker': 'TextControl',
  'collection-picker': 'TextControl',
  richtext: 'TextareaControl',
  markdown: 'TextareaControl',
  code: 'TextareaControl',
  repeater: 'TextareaControl',
  number: 'NumberControl',
  range: 'RangeControl',
  toggle: 'ToggleControl',
  select: 'SelectControl',
  color: 'ColorPalette',
  image: 'BaseControl',
};

describe('FieldControl — 15-type mapping', () => {
  for (const [type, marker] of Object.entries(EXPECTED) as [WeaveInputType, string][]) {
    it(`maps '${type}' → ${marker}`, () => {
      const value =
        type === 'image'
          ? { id: null, url: '' }
          : type === 'repeater'
            ? []
            : type === 'toggle'
              ? false
              : type === 'number' || type === 'range'
                ? 0
                : '';
      const { container } = render(
        <FieldControl input={inputOf(type)} value={value} onChange={noop} data={{}} />,
      );
      expect(container.querySelector(`[data-wp-control="${marker}"]`)).not.toBeNull();
    });
  }
});

describe('FieldControl — condition gating', () => {
  it('renders nothing when condition evaluates false', () => {
    const input = {
      type: 'text',
      name: 'field',
      label: 'Field',
      condition: 'show.eq.true',
    } as WeaveInput;
    // sanity: 'show.eq.true' against { show: false } is false (String(false) !== 'true')
    expect(evaluateCondition('show.eq.true', { show: false })).toBe(false);
    const { container } = render(
      <FieldControl input={input} value="x" onChange={noop} data={{ show: false }} />,
    );
    expect(container.querySelector('[data-wp-control]')).toBeNull();
  });

  it('renders the control when condition evaluates true', () => {
    const input = {
      type: 'text',
      name: 'field',
      label: 'Field',
      condition: 'show.eq.true',
    } as WeaveInput;
    const { container } = render(
      <FieldControl input={input} value="x" onChange={noop} data={{ show: true }} />,
    );
    expect(container.querySelector('[data-wp-control="TextControl"]')).not.toBeNull();
  });
});

describe('FieldControl — fail-soft + onChange', () => {
  it('renders null for an unknown type without throwing', () => {
    const input = { type: 'mystery', name: 'field', label: 'Field' } as unknown as WeaveInput;
    const { container } = render(<FieldControl input={input} value="" onChange={noop} data={{}} />);
    expect(container.querySelector('[data-wp-control]')).toBeNull();
  });

  it('threads the new value up through onChange (text)', () => {
    const onChange = vi.fn();
    render(<FieldControl input={inputOf('text')} value="" onChange={onChange} data={{}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed' } });
    expect(onChange).toHaveBeenCalledWith('typed');
  });
});
