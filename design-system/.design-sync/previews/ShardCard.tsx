import { ShardCard } from '@starshard/design-system';

export function FaceDown() {
  return <ShardCard kind="house" revealed={false} />;
}

export function Mirror() {
  return (
    <ShardCard
      kind="mirror"
      title="The Dreamer · moon in Pisces"
      body="Your moon is Jung's dreamer-mystic: the membrane between you and everything else is thin and shimmery. Protect your softness; it's an instrument."
    />
  );
}

export function Moon() {
  return (
    <ShardCard
      kind="moon"
      title="Baṭn al-Ḥūt: 'the belly of the fish'"
      body="Your moon rests in the 28th of the 28 lunar mansions charted by classical Arab astronomers: a homecoming moon. however far you swim, you always know the way back."
    />
  );
}

export function Hearth() {
  return (
    <ShardCard
      kind="hearth"
      title="born on Tuesday, day of Mars"
      body='Tuesday’s child is "full of grace," but Mars rules Tuesday, so it’s the grace of a sword dance.'
    />
  );
}
