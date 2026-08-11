import { Window } from '@starshard/design-system';

export function Focused() {
  return (
    <Window title="account.exe" icon="🔑">
      <p style={{ margin: 0 }}>choose a new password for your shard account ♡</p>
    </Window>
  );
}

export function Blurred() {
  return (
    <Window title="luna.txt" icon="📜" focused={false}>
      blurred state
    </Window>
  );
}
