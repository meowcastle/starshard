# Going deeper, and who this is for (research, 14 Oct 2026)

## Part 1. What a master engine builder would do

### Start from what "Turing complete" actually means
Churchill, Biderman and Herrick (2019) built a legal Magic position that runs a universal Turing machine, so in the worst case nothing can compute perfect play. But tournament Standard almost never visits those positions. The hard part of real Magic is **breadth**, not depth: thousands of cards, each its own rules exception, and hidden information. Forge already gets the rules right. Its weakness is the decision layer, which is a pile of per-card hints (that is why Day of Black Sun is blank: nobody wrote the hint). A system architect fixes the layer that limits the whole system, not the cards one at a time. (Small correction for the record: Richard Garfield's PhD is in combinatorial mathematics, not physics.)

### The architecture
1. **Rules engine as a trusted oracle.** Keep Forge for legality and state; never put intelligence in it. The bridge we already have is the right seam.
2. **A policy learned from human games, not written by hand.** This is the Maia move in chess: a network trained on 100M+ human Lichess games, one per rating band, predicts the exact human move 53% of the time (vs 43% for Leela and 38% for Stockfish). It plays *like people*, which is precisely what our fidelity problem is. For Magic the data source is Arena logs (ours, from users who opt in) for Standard, plus 17lands' public Limited datasets for pre-training the general skills (combat, sequencing, mana use) that transfer across formats.
3. **Cards understood from their text.** A policy that only knows cards it has seen dies every set. Card representations built from Oracle text (a language model's embedding, fine-tuned) let the policy handle a card it has never seen, the way a person reads a new card. That is the real fix for the dead-card class of problem.
4. **Search only where it pays.** Exact solvers for narrow sub-problems (combat, mana, mulligans, lethal checks); the learned policy for everything else; short search guided by the learned policy at close calls. This is how the strongest game AIs combine the two.
5. **A metagame layer on top.** The field is a population game. Given the matchup matrix with its uncertainty and the expected field, a solver finds the deck (and the 75, and the sideboard plan) with the best expected result, the way poker solvers find strategies. Pros do this informally in a group chat the week before an event.
6. **The data flywheel.** Every user who shares a log improves the human-play model, which improves every number on the site, which brings more users. Calibration data is the moat.

### Stages
- Now: method fixes from RESEARCH-METHOD-14OCT.md (ruler, SPRT, knobs and fitting, paired differences, exact sub-solvers).
- Next (logs in hand, a few thousand human games): behaviour cloning of human decisions at the close calls the knobs control; the knobs become a learned model.
- Then (tens of thousands of games, plus 17lands pre-training): a full human-like policy with text-based card representations; Forge stays as the oracle.
- Alongside: the metagame solver, since it needs only the matchup matrix and is the most valuable single feature for serious players.

## Part 2. Is this for good players or for bad ones?
The precedents say tools like this end up most valuable to serious players, provided they are trustworthy:
- **Chess:** engines are the core of elite preparation; Maia was built specifically for teaching human-level players.
- **Poker:** solvers started with high-stakes professionals around 2015 and became central to serious study; the strongest players are separated by how well they interpret solver output, not by whether they use it.
- **Hearthstone:** HSReplay's data became standard prep for competitive players.
- **Magic itself:** Frank Karsten's simulation and hypergeometric work set how the whole competitive scene builds mana bases; pro testing is weeks of games among a few people, documented by hand, and limited by playtest partners and time.

What a serious player will and won't use:
- **Won't trust:** a headline win rate from an AI that misplays control. Pros will test that on day one and leave if it is wrong.
- **Will use:** exact maths (mana, mulligans, opening hands, lethal); real-match data with honest intervals (better than what is public); paired comparisons ("is 2 Duress better than 2 Get Lost here, on the same shuffles"); sideboard plans tested post-board; a metagame solver for deck choice; their own leak report.
- **The real market** is the large middle: RCQ and store-championship grinders with jobs, who care a lot and have no testing team. The sim is their testing team. Beginners benefit from the coach, but they are not who keeps a tool like this honest or alive.

The design consequence: lead with the things serious players can verify (exact maths, real data, paired differences), show the method and the error bars everywhere, and let the headline win rate earn trust last. That is also the order the engine work already points to.

## Sources
- Churchill, Biderman, Herrick, "Magic: The Gathering is Turing Complete" (2019)
- Maia (Lichess blog): https://lichess.org/blog/X9PUixUAANCqFRSh/introducing-maia-a-human-like-neural-network-chess-engine · Maia-2: https://arxiv.org/pdf/2409.20553
- Poker solvers (Pokerology): https://www.pokerology.com/poker/features/poker-solvers/
- Pro Tour testing (StarCityGames, Zac Hill): https://articles.starcitygames.com/articles/chatter-of-the-squirrel-full-disclosure-berlin-testing-uncovered-part-1/
