import { useEffect, useRef } from 'react';

import '@gouvfr/dsfr-chart/GaugeChart';
import '@gouvfr/dsfr-chart/GaugeChart.css';

/**
 * React wrapper around the DSFR Charts "Jauge" web component (`<gauge-chart>`).
 *
 * The library ships no TypeScript types and is a Vue-based custom element, so
 * we declare the intrinsic element below and set its attributes imperatively
 * via a ref (custom elements observe attribute changes and re-render).
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gauge-chart': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export interface GaugeChartProps {
  /** Current value (e.g. number of verified housings). */
  value: number;
  /** Starting value of the gauge. Defaults to 0. */
  init?: number;
  /** Target value (e.g. total number of housings). */
  target: number;
  /** Whether the DSFR legend is displayed. Defaults to true. */
  legend?: boolean;
  /** Gauge height (CSS value). The library defaults to "2rem". */
  height?: string;
  className?: string;
}

function GaugeChart(props: Readonly<GaugeChartProps>) {
  const { value, init = 0, target, legend = true, height, className } = props;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.setAttribute('value', String(value));
    element.setAttribute('init', String(init));
    element.setAttribute('target', String(target));
    element.setAttribute('legend', String(legend));
    if (height) {
      element.setAttribute('height', height);
    }
  }, [value, init, target, legend, height]);

  return (
    <div className={className}>
      <gauge-chart ref={ref} />
    </div>
  );
}

export default GaugeChart;
