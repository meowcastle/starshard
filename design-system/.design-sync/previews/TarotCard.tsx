import { TarotCard } from '@starshard/design-system';

export function Face() {
  return <TarotCard numeral="IX" name="Al-Ṭarf" epithet={'"the glance"'} />;
}

export function Rare() {
  return (
    <TarotCard
      numeral="XXIV"
      name="Saʿd al-Suʿūd"
      epithet={'"the luckiest of the lucky"'}
      rare
    />
  );
}

export function Back() {
  return <TarotCard faceDown />;
}
