# Buying cards from the sim: affiliate links, or own the transaction? (16 Oct 2026)

The question: when the sim says "you're 5 cards short, about $61", should it send the player to a shop and take a commission, or sell the cards itself?

## 1. What the shops pay and charge

| | Seller pays | Buyer pays | Affiliate pays us | Prefilled list link |
|---|---|---|---|---|
| **TCGplayer** (eBay-owned; the default marketplace, deepest inventory) | 10.75% commission (9.25% Pro) + 2.5% + $0.30 processing, so a bit over 13% | shipping per seller | **3.5%** of the referred cart, 48-hour first-click window, whole cart credited; paid 45 days after month end; join through Impact | yes, Mass Entry takes "qty name" in the URL; optimizer picks sellers |
| **Card Kingdom** (single retailer, one package) | n/a, they own the stock | their prices, often above market | affiliate program exists (it's how The Professor is paid), rate not public | no URL; paste into their builder |
| **Mana Pool** (2024, Magic-only, two engineers and a store owner) | 5% capped at $50 + 2.9% + $0.30, about 8% | **4.2%** buyer fee on singles | a partner program with "Buy" buttons on Archidekt, Moxfield, EDHREC and Cube Cobra; terms not public | mass entry form; API docs exist; URL prefill not documented |
| **EvoMarket** (newest) | 10% + $0.30, vetted sellers | none | — | — |
| **eBay** | about 13.25% | — | eBay Partner Network, 1–4% | no |

Total platform take on a $100 single, both sides: about $14 on eBay, $13 on TCGplayer, $12.60 on Mana Pool, $10.90 on EvoMarket.

## 2. How the tools we benchmarked make money from purchases
Every deck site does the same thing: a Buy button per card and per list, TCGplayer first, then Card Kingdom and now Mana Pool, with an affiliate code in the link. AetherHub publishes the arithmetic: 3.5% of the cart, last click, and it swaps its own code for a creator's on that creator's decks. Moxfield and Archidekt run on the same links plus Patreon. Nobody we looked at owns the transaction; the ones that sell cards (TCGplayer, Card Kingdom) are shops first and tools second.

What 3.5% is worth: a player finishing a Standard deck spends $40–250 at TCGplayer. At $100 a cart that's $3.50 to us. A thousand carts a month is $3,500. The compute for a top-10 run costs more than the affiliate on the cart it leads to; buy links are a courtesy with a small rebate, not a business.

## 3. Owning the transaction: what it takes
A marketplace needs sellers with stock, a catalog of every printing and condition, payments with fraud and chargeback handling, shipping, returns, condition disputes, sales tax in every state, and, hardest, buyers. Mana Pool launched with three founders and eighteen months of work and is still "young" on the buyer side; EvoMarket is smaller. Both compete on fee (8–11% against 13%) and still can't match TCGplayer's depth. A tool with a few hundred users brings neither sellers nor the buyer pool that attracts them.

There is also a policy problem. The Fan Content Policy allows ads, sponsorship and donations; a card store is a separate business under Wizards' retailer rules and a different legal footing. Ask the lawyer before this is a plan.

Two lighter forms of "owning it" are worth more than a marketplace:
- **Be the buyer's optimizer, not the shop.** The sim knows the list, the missing cards, and the budget dial. Send the whole cart to one place (TCGplayer Mass Entry today, Mana Pool's optimizer once there is a link), with the affiliate code. The player sees one checkout; we see the 3.5%. This is what's drawn (changes 19, 20, 23).
- **The store as the fulfilment partner.** The paper player buys singles at an LGS. TCGplayer Pro stores take in-store pickup orders with no fee. If a store partners with the sim, "pick up at Twenty Sided" is a line on the buy screen and the store gets the order. No stock, no shipping, no tax for us; the LGS is the marketplace. This is the paper-first answer, and the one the RCQ player would use.

## 4. Recommendation
1. **Don't build a marketplace.** The economics don't support it at any scale the sim will reach, and the policy risk is real.
2. **Join TCGplayer's affiliate program** (Impact; the code goes in one place in the page) and add Mana Pool's partner buttons when their link format is public. Keep Card Kingdom as copy-and-open.
3. **Make the sim the best buy-list optimizer a player has**: the missing-cards link, the "owned version" that cuts the bill, the craft table that says which purchases are worth points and which aren't. That is the thing no shop can do, and it's what makes the 3.5% click happen.
4. **Later, if there is a local scene:** in-store pickup through a partner LGS's TCGplayer Pro account.
5. **Charge for the sim, not the cards.** Credits for compute and the coach are the business; the affiliate rebate is a footnote in the ledger.

## Sources
- TCGplayer affiliate program (Impact, first-click, 48 hours, whole cart): https://docs.tcgplayer.com/docs/tcgplayer-affiliate-program
- AetherHub on the program (3.5%, creator code swap): https://aetherhub.com/Article/Updates-to-the-TCGPlayer-Affiliate-program
- TCGplayer seller fees: https://help.tcgplayer.com/hc/en-us/articles/201357836
- Marketplace comparison 2026 (eBay, TCGplayer, Mana Pool, EvoMarket): https://benstonetcg.medium.com/battle-of-the-tcg-marketplaces-best-place-to-buy-and-sell-tcg-singles-in-2026-af8b27c6a2aa
- Mana Pool mass entry and partner buttons: https://manapool.com/mass-entry-info
- Card Kingdom affiliates (The Professor): https://blog.cardkingdom.com/card-kingdom-affiliates-tolarian-community-college/
- TCGplayer on content creators earning from a Magic site: https://www.tcgplayer.com/content/article/How-Content-Creators-May-Profit-from-a-Magic-The-Gathering-Website/151df4da-109b-47c5-b27f-6ec94356df96/
