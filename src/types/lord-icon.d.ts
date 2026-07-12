import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          trigger?: 'hover' | 'click' | 'loop' | 'morph' | 'boomerang' | 'loop-on-hover';
          colors?: string;
          state?: string;
          delay?: string | number;
          stroke?: string | number;
          scale?: string | number;
        },
        HTMLElement
      >;
    }
  }
}
