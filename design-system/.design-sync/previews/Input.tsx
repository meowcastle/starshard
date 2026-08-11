import { Input } from '@starshard/design-system';

export function WithLabel() {
  return <Input label="your name" placeholder="mikufan39" />;
}

export function Password() {
  return <Input label="password" type="password" placeholder="8+ characters" />;
}

export function WithHint() {
  return (
    <Input
      label="email"
      type="email"
      placeholder="you@example.com"
      hint="we'll never share this ♡"
    />
  );
}
