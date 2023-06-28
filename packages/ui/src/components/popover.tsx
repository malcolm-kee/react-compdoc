import * as PopoverPrimitive from '@radix-ui/react-popover';
import { styled } from '../stitches.config';
import {
  slideDownAndFade,
  slideLeftAndFade,
  slideRightAndFade,
  slideUpAndFade,
} from './animations';

const StyledContent = styled(PopoverPrimitive.Content, {
  borderRadius: 4,
  padding: 20,
  width: 260,
  backgroundColor: 'white',
  boxShadow:
    'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade },
      '&[data-side="right"]': { animationName: slideLeftAndFade },
      '&[data-side="bottom"]': { animationName: slideUpAndFade },
      '&[data-side="left"]': { animationName: slideRightAndFade },
    },
  },
  '&:focus': {
    shadow: 'lg',
  },
});

const StyledArrow = styled(PopoverPrimitive.Arrow, {
  fill: 'white',
});

const StyledClose = styled(PopoverPrimitive.Close, {
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '$gray-700',
  position: 'absolute',
  top: 5,
  right: 5,
  '&:hover': { backgroundColor: '$gray-200' },
  outlineRing: '',
});

export const Popover = Object.assign(PopoverPrimitive.Root, {
  Trigger: PopoverPrimitive.Trigger,
  Anchor: PopoverPrimitive.Anchor,
  Content: StyledContent,
  Arrow: StyledArrow,
  Close: StyledClose,
  RawClose: PopoverPrimitive.Close,
  Portal: PopoverPrimitive.Portal,
});
