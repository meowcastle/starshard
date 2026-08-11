import { Button } from '@starshard/design-system';

export function Primary() {
  return <Button variant="primary">✦ weave my reading ✦</Button>;
}

export function Secondary() {
  return <Button variant="secondary">back to log in</Button>;
}

export function Tertiary() {
  return <Button variant="tertiary">skip for now</Button>;
}

export function Disabled() {
  return (
    <Button variant="primary" disabled>
      sending…
    </Button>
  );
}
