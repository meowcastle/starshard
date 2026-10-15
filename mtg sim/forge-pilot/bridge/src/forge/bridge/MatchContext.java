package forge.bridge;

/** Per-match settings shared by both external controllers. */
public final class MatchContext {
    public volatile int game = 0;
    /** Games won so far in this match, by seat (free information: the match score). */
    public final int[] wins = new int[2];
    /**
     * Actions taken for a seat WITHOUT asking its agent, counted per game by "category|what|reason" (see
     * docs/DECISION-PROVENANCE.md). forced = only one legal action; policy = a configured rule (e.g. meaningful stops,
     * auto mana payment); delegated = a real choice made by Forge's AI or a default. Sent with game_end, then reset.
     */
    @SuppressWarnings("unchecked")
    public final java.util.Map<String, Integer>[] auto = new java.util.Map[] { new java.util.TreeMap<>(), new java.util.TreeMap<>() };

    public synchronized void auto(int seat, String category, String what, String reason) {
        auto[seat].merge(category + "|" + what + "|" + reason, 1, Integer::sum);
    }

    /** This game's counts for a seat as JSON, then cleared for the next game. */
    public synchronized com.google.gson.JsonArray drainAuto(int seat) {
        com.google.gson.JsonArray a = new com.google.gson.JsonArray();
        for (java.util.Map.Entry<String, Integer> e : auto[seat].entrySet()) {
            String[] k = e.getKey().split("\\|", 3);
            com.google.gson.JsonObject o = new com.google.gson.JsonObject();
            o.addProperty("category", k[0]);
            o.addProperty("what", k[1]);
            o.addProperty("reason", k[2]);
            o.addProperty("count", e.getValue());
            a.add(o);
        }
        auto[seat].clear();
        return a;
    }
    public final int maxTurns;
    /** Only ask at meaningful priority stops (see PlayerControllerExternal.shouldStop). */
    public final boolean smartStops;
    /** Ask about mana payment even when every legal payment taps the same kind of sources. */
    public final boolean alwaysAskMana;
    /** Re-asks after an answer that fails in-game (lands that can't pay, illegal attack) before the decision is forfeited. */
    public final int maxRetries;

    /**
     * starshard: the decision kinds the pilot owns (null = every kind, as upstream). Any other kind goes straight to
     * Forge's AI without a round trip, so a pilot that owns mulligans plays everything else exactly as `forge sim` does.
     */
    @SuppressWarnings("unchecked")
    public final java.util.Set<String>[] own = new java.util.Set[2];

    /** starshard: Search.java's settings: play-outs per candidate, turns before the evaluator scores, candidates at most. */
    public int searchRollouts = 8, searchTurns = 1, searchMax = 5;
    /** override Forge's choice only when a candidate beats it by this many standard errors */
    public double searchMargin = 2.0;
    /** screen a decision first and skip the play-outs when the best leads by this much (0 = off); searchRollouts is then the play-out budget */
    public int searchScreen = 50;

    /** starshard: the pilot-error knob (PlayerControllerExternal): skip a play / withdraw an attacker or blocker with these
     *  probabilities, per seat (one value given on the command line applies to both). */
    public double[] errPlay = { 0, 0 }, errCombat = { 0, 0 };
    public java.util.Random errRng = new java.util.Random(1);
    public final int[] errors = new int[2];

    public boolean owns(int seat, String kind) {
        return own[seat] == null || own[seat].contains(kind);
    }

    public MatchContext(int maxTurns, boolean smartStops, boolean alwaysAskMana, int maxRetries) {
        this.maxTurns = maxTurns;
        this.smartStops = smartStops;
        this.alwaysAskMana = alwaysAskMana;
        this.maxRetries = maxRetries;
    }
}
