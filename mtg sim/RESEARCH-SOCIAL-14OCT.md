# A social layer for brewers that isn't trash (research, 14 Oct 2026)

Justin's brief: a social element for brewers that is useful and builds community, without the exploitative shape most social apps take. What follows is what the evidence and the brewing culture say, then a design that fits the sim, in the order to build it.

## 1. Why most social layers are bad, in one paragraph
A recent framework paper on "reclaiming the social" puts it plainly: the harms come from the attention business model, not from connection itself, and its remedies are structural: remove personalised feeds, trending lists, popularity rankings, messages from strangers and content spreading beyond what its author allowed; add a finite feed from people you chose, sorting you control, and abuse reporting that works. It even asks whether visible like and follower counts are needed at all. A fitness-industry analysis of "the social layer problem" lands in the same place from the business side: kudos, feeds and leaderboards create competitive pressure without belonging; what retains people is *community architecture*, which is shared identity, shared practice and peer accountability, with onboarding that connects a newcomer to existing members, recurring rituals that build group memory, and identity signals relative to each other rather than to the platform. Strava's own data: group activities earn roughly twice the kudos of solo ones; a club that has met weekly for three years is the thing people won't leave. The lesson is not "add a feed"; it is "give people a shared practice and a shared history".

## 2. Where brewers already gather, and what they want
- **Deck links travel; the conversation happens elsewhere.** Across the deck builders, the one with real community is TappedOut ("deck comment sections get real engagement", "forums are active") and its interface is twenty years old; Moxfield is where links come from, but its social surface is a link; everything else has none or "poorly organised" discussion. The talk itself lives on Discord servers built around a format or an archetype (the MTG Metacord: 7,000 people improving on Modern and Pioneer's top decks) and on Reddit.
- **What brewers ask for, in their words** (a TappedOut thread on homebrewing at FNM): to have their deck taken seriously ("Homebrews make no player inferior. EVER."); feedback *with the reasoning*, so the discussion refines the deck instead of swapping cards; "deck tech friends" and asking the person who beat you for pointers; testing, since "tournament decks were once homebrews perfected and tested for weeks". And what goes wrong: suggestions that turn personal, the netdeck-versus-brew snobbery in both directions, no time to test.
- **The best model from another game is Lichess Studies:** a shared analysis board with chapters, where invited contributors annotate together in real time, public or private, exportable, free. The object at the centre is the work (a line of analysis), not a profile, and the social act is improving it together. That is a brewer's deck tech and a sideboard plan, exactly.
- **Civility is a structure, not a rule.** Discourse's trust levels: newcomers are sandboxed (no DMs, limited posting) until they have read for a while; rights grow with demonstrated behaviour; regulars' flags act at once. It scales moderation with the community instead of with the owner's evenings.

## 3. What the sim has that no community has
Every other place, a deck suggestion is an opinion. Here it can be **tested**: a reviewer's "cut the Leylines for Get Lost" becomes a version, runs against the field, and comes back with a number and an evidence grade, the same way the coach's suggestions do. That single fact changes the social dynamic: advice stops being status and becomes a claim that gets checked, arguments end in a run instead of a thread, and reputation can be earned by being right rather than loud. The second asset is the game logs: people who share Arena logs are contributing to the human baseline every brewer benefits from, which is the 17lands bargain (give data, get insight) and a reason to belong that no feed provides.

## 4. Principles for the sim's social layer
1. **The deck is the room.** Every conversation is attached to a brew version, a guide, or a run, never free-floating. No global feed, no timeline, nothing to scroll.
2. **Small by default.** People, not the public: pods of a few to a few dozen (your store, your Discord, your three friends). Public is a per-guide switch the owner flips, as it is today.
3. **No counts.** No likes, followers, karma or leaderboards. The visible signals are things that mean something: "tested", "adopted into v4", "played it at the RCQ, 5–2".
4. **Reasons required.** A suggestion needs a why and a what-instead (the coach's own shape: out, in, why). The form enforces the culture brewers asked for.
5. **Nobody can reach you who you didn't invite.** No messages from strangers; the invite tree is the trust model; trust levels gate the rest.
6. **Rituals over notifications.** A weekly rhythm the group owns (the field refresh, the pod's brew night, the event weekend) rather than pings engineered to bring people back. The only notifications are a reply to you, a test result you asked for, and the pod's weekly.
7. **Leaving costs nothing.** Export everything; delete the account and it's gone; the data is never sold and never trains anything the member didn't opt into. Receipts of that on the page, not in a policy.

## 5. The features, in order
**A. Reviews on a guide (the Lichess Study move).** Anyone the owner shares a guide with can leave a note anchored to a line (a matchup row, a card, the sideboard sheet) in the coach's suggestion shape: out / in / why. The owner can **Test it** (it becomes a version and a run, with the reviewer named on it), **Adopt** it (into the next version, credited in What changed), or **Decline** with a sentence. A reviewer's record is the list of their suggestions and what happened to them; that is the whole reputation system. Needs: the guide's share link (exists), a notes table, the Test path (exists for the coach), one Design panel.

**B. Pods.** A pod is an invite-only group with a name, its members' current decks, and its own field: "run my deck against the pod" uses the members' latest versions as the gauntlet, which is the most natural thing a group of brewers could want from a simulator and something no other site can offer. The pod page is the members' decks, this week's movers, and the open reviews. One owner, invite links, a weekly rhythm chosen by the pod (the Thursday before FNM). Needs: `pods`, `pod_members`, an oppSet built from members' versions, one page.

**C. The weekly brew.** A ritual, per pod or for everyone who opts in: a prompt (a card, a theme, a budget), one week, entries are versions, the sim runs every entry against the same field, the pod reads the results together. No winner is declared unless the pod wants one; the results page is the shared memory. Needs: a `brews` table of prompts and entries, the batch runner, a results page.

**D. Event circles.** A short-lived pod around a date: the RCQ on the 25th. Members share sideboard sheets, log their rounds (the Log a match form, pooled), and the circle's record against the field that day becomes the next week's calibration input. Dissolves after the event; the record stays.

**E. The baseline.** Members who share Arena logs see the pooled human statistics beside their own (anonymised, counts only), and the page says what their logs made possible ("your 40 games are in the control baseline"). Opt-in, revocable, shown on the Account tab.

**F. Trust and safety, from day one.** Discourse-style levels (invited → member after reading and one adopted review → regular after a month and three adopted reviews); regulars can hide a note; the owner of a guide or pod removes anyone; a report goes to Justin with the note and the thread; no DMs at all in v1 (the pod is the channel).

## 6. What not to build
A profile page with stats. A global "popular decks" list. Follower counts. An infinite feed of other people's versions. Push notifications for anything but a reply, a result, and the weekly. DMs. Reactions. Anything that scores people instead of claims.

## 7. Where to start
A then B, in that order: A needs almost nothing the sim doesn't have and is the proof of the idea (feedback that gets tested); B is the thing that makes a group of friends choose this over a Discord channel and a Moxfield link, because the simulator can run the group's decks against each other. C and D are the rituals that give the pod a history, and they can wait for a pod to exist. The question for Justin before Design draws anything: is the first community his own circle (friends and the store), which argues for pods first, or strangers finding shared guides, which argues for reviews first? The answer decides which of A and B gets the first week.

## Sources
- Reclaiming the Social in Social Media (arXiv, 2026): https://arxiv.org/html/2609.35413v1
- The Social Layer Problem (OneElevate): https://www.oneelevate.com/article/the-social-layer-problem
- Best MTG deck builder sites, community notes (GrimDeck): https://grimdeck.com/blog/best-mtg-deck-builder-sites
- Homebrewing at FNM (TappedOut forum thread): https://tappedout.net/mtg-forum/standard/homebrewing-at-fnm
- The MTG Metacord (Discord listing): https://discordhunt.com/en/servers/the-mtg-metacord-474292624509894656
- Study chess, the Lichess way: https://Lichess.org/blog/V0KrLSkAAMo3hsi4/study-chess-the-lichess-way
- Understanding Discourse trust levels: https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/
- Moxfield Discord: https://discord.com/invite/moxfield
