package forge.bridge;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.google.common.eventbus.Subscribe;

import forge.LobbyPlayer;
import forge.ai.ComputerUtilAbility;
import forge.ai.PlayerControllerAi;
import forge.ai.simulation.GameCopier;
import forge.ai.simulation.GameStateEvaluator;
import forge.game.Game;
import forge.game.GameEndReason;
import forge.game.GameOutcome;
import forge.game.card.Card;
import forge.game.card.CardCollection;
import forge.game.event.GameEventPlayerPriority;
import forge.game.player.Player;
import forge.game.spellability.SpellAbility;
import forge.game.zone.ZoneType;

/**
 * starshard: flat Monte Carlo search over one priority decision. Each candidate (pass, or a
 * spell, ability or land) is tried on copies of the game (Forge's own GameCopier): Forge's AI
 * plays both sides of the copy, the searching player's first choice forced to the candidate,
 * libraries reshuffled, until the game ends or `turns` more turns pass (then Forge's position
 * evaluator scores it). The candidate with the best average wins.
 *
 * Hidden information: each copy deals the opponent a random hand from their hand and library
 * together (PEEK=false, the default); SEARCH_PEEK=1 keeps their real hand, for comparison.
 */
final class Search {
    private Search() {}

    static final boolean TRACE = "1".equals(System.getenv("SEARCH_TRACE"));
    static final boolean PEEK = "1".equals(System.getenv("SEARCH_PEEK"));

    /** Forge's AI, except its first priority choice is fixed to the candidate being tried. */
    static final class Forced extends PlayerControllerAi {
        private final SpellAbility first;
        private boolean used = false;

        Forced(Game g, Player p, LobbyPlayer lp, SpellAbility first) {
            super(g, p, lp);
            this.first = first;
        }

        @Override
        public List<SpellAbility> chooseSpellAbilityToPlay() {
            if (!used) {
                used = true;
                return first == null ? null : Collections.singletonList(first);
            }
            return super.chooseSpellAbilityToPlay();
        }
    }

    /** Ends a copy once it passes a turn, scoring the position for `me` first (a finished game scores as lost). */
    static final class Cap {
        private final Game game;
        private final Player me;
        private final int last;
        boolean reached = false;
        int score = 0;

        Cap(Game game, Player me, int last) {
            this.game = game;
            this.me = me;
            this.last = last;
        }

        @Subscribe
        public void onPriority(GameEventPlayerPriority e) {
            if (game.getPhaseHandler().getTurn() > last && !game.isGameOver()) {
                reached = true;
                score = rel(game, me);
                for (Player p : game.getPlayers()) p.intentionalDraw();
                game.setGameOver(GameEndReason.Draw);
            }
        }
    }

    /** A win or loss counts this much; a capped play-out scores my position minus the opponent's, within it. */
    static final int W = 3000;

    /**
     * The learned leaf (tools/eval-fit.js, NOTE-TO-RESEARCH-13OCT-EVALUATOR.md): a logistic model on 13
     * board differences, read from --search-eval. When set, a capped play-out scores (2p - 1) * W, p the
     * model's chance that `me` wins, in place of Forge's GameStateEvaluator difference.
     */
    static double[] evalMean, evalSd, evalW; static double evalB;
    static void loadEval(String file) throws java.io.IOException {
        com.google.gson.JsonObject o = com.google.gson.JsonParser.parseString(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(file)), java.nio.charset.StandardCharsets.UTF_8)).getAsJsonObject();
        evalMean = arr(o.getAsJsonArray("mean")); evalSd = arr(o.getAsJsonArray("sd")); evalW = arr(o.getAsJsonArray("weights")); evalB = o.get("intercept").getAsDouble();
    }
    private static double[] arr(com.google.gson.JsonArray a) { double[] d = new double[a.size()]; for (int i = 0; i < d.length; i++) d[i] = a.get(i).getAsDouble(); return d; }
    /** One side's numbers, in the log's feature order (GameLog.java / eval-fit.js sideOf). */
    static double[] side(Game g, Player p) {
        int lands = 0, untapped = 0, creatures = 0, power = 0, tough = 0, evasive = 0, other = 0, otherMv = 0;
        for (Card c : p.getCardsIn(ZoneType.Battlefield)) {
            if (c.isLand()) { lands++; if (!c.isTapped()) untapped++; }
            else if (c.isCreature()) {
                creatures++; power += c.getNetPower(); tough += c.getNetToughness();
                if (c.hasKeyword(forge.game.keyword.Keyword.FLYING) || c.hasKeyword(forge.game.keyword.Keyword.MENACE) || c.hasKeyword(forge.game.keyword.Keyword.TRAMPLE)) evasive++;
            } else { other++; otherMv += Math.max(0, c.getCMC()); }
        }
        return new double[]{ lands, untapped, p.getLife(), p.getCardsIn(ZoneType.Hand).size(), creatures, power, tough, evasive, other, otherMv, p.getCardsIn(ZoneType.Library).size() };
    }
    static double winChance(Game g, Player me) {
        Player op = me.getWeakestOpponent();
        double[] a = side(g, me), b = side(g, op);
        double[] x = new double[13];
        for (int i = 0; i < 11; i++) x[i] = a[i] - b[i];
        x[11] = g.getStartingPlayer() == me ? 1 : -1;
        x[12] = g.getPhaseHandler().getTurn() / 10.0;
        double t = evalB;
        for (int i = 0; i < 13; i++) t += evalW[i] * (x[i] - evalMean[i]) / evalSd[i];
        return 1 / (1 + Math.exp(-t));
    }

    static int rel(Game g, Player me) {
        if (evalW != null) return (int) Math.round((2 * winChance(g, me) - 1) * W);
        GameStateEvaluator e = new GameStateEvaluator();
        int v = e.getScoreForGameState(g, me).value - e.getScoreForGameState(g, me.getWeakestOpponent()).value;
        return Math.max(-W, Math.min(W, v));
    }

    /** The same ability on the copy of its host card, matched by kind and text. */
    private static SpellAbility find(GameCopier cp, SpellAbility sa, Player me) {
        Card host = cp.find(sa.getHostCard());
        if (host == null) return null;
        CardCollection one = new CardCollection();
        one.add(host);
        for (SpellAbility c : ComputerUtilAbility.getSpellAbilities(one, me)) {
            if (c.isLandAbility() == sa.isLandAbility() && String.valueOf(c.getDescription()).equals(String.valueOf(sa.getDescription()))) {
                c.setActivatingPlayer(me);
                return c;
            }
        }
        return null;
    }

    /** One play-out: +W the searcher won, -W lost, else the position difference at the turn limit; NaN if the copy failed. */
    static double rollout(Game orig, Player origMe, SpellAbility cand, int turns) {
        try {
            GameCopier cp = new GameCopier(orig);
            Game g = cp.makeCopy();
            for (Player p : g.getPlayers()) p.dangerouslySetController(new PlayerControllerAi(g, p, p.getLobbyPlayer()));
            Player me = cp.find(origMe);
            SpellAbility c = cand == null ? null : find(cp, cand, me);
            if (cand != null && c == null) return Double.NaN;
            me.dangerouslySetController(new Forced(g, me, me.getLobbyPlayer(), c));
            for (Player p : g.getPlayers()) p.getZone(ZoneType.Library).shuffle();
            if (!PEEK) {
                // the searcher doesn't know their hand: deal one from everything it can't see
                Player op = me.getWeakestOpponent();
                List<Card> hand = new ArrayList<>(op.getCardsIn(ZoneType.Hand)), pool = new ArrayList<>(hand);
                pool.addAll(op.getCardsIn(ZoneType.Library));
                Collections.shuffle(pool, forge.util.MyRandom.getRandom());
                op.getZone(ZoneType.Hand).setCards(new ArrayList<>(pool.subList(0, hand.size())));
                op.getZone(ZoneType.Library).setCards(new ArrayList<>(pool.subList(hand.size(), pool.size())));
            }
            if (TRACE) { Player op = me.getWeakestOpponent(); System.err.println("[search] start turn " + g.getPhaseHandler().getTurn() + " " + g.getPhaseHandler().getPhase() + " me lib " + me.getCardsIn(ZoneType.Library).size() + " hand " + me.getCardsIn(ZoneType.Hand).size() + " life " + me.getLife() + " | opp lib " + op.getCardsIn(ZoneType.Library).size() + " life " + op.getLife() + " | orig me lib " + origMe.getCardsIn(ZoneType.Library).size()); }
            Cap cap = new Cap(g, me, g.getPhaseHandler().getTurn() + turns);
            g.subscribeToEvents(cap);
            g.getPhaseHandler().mainGameLoop();
            if (cap.reached || !g.isGameOver()) {
                int v = cap.reached ? cap.score : rel(g, me);
                if (TRACE) System.err.println("[search] capped, score " + v);
                return v;
            }
            GameOutcome out = g.getOutcome();
            if (TRACE) System.err.println("[search] copy from turn " + orig.getPhaseHandler().getTurn() + " ended turn " + g.getPhaseHandler().getTurn()
                    + ", reason " + (out == null ? "null" : out.getWinCondition()) + ", me " + me.getName() + " lost=" + me.hasLost() + " (" + me.getOutcome() + ") life " + me.getLife() + " lib " + me.getCardsIn(ZoneType.Library).size() + " won=" + (out != null && out.isWinner(me.getLobbyPlayer())) + " cap=" + cap.reached);
            if (out == null || out.isDraw()) return 0;
            return me.hasLost() ? -W : out.isWinner(me.getLobbyPlayer()) ? W : 0;
        } catch (Throwable t) {
            if (TRACE) { System.err.println("[search] copy failed: " + t); t.printStackTrace(); }
            return Double.NaN;
        }
    }

    /** The best candidate (null = pass), whether it beat Forge's own choice, and what each scored. */
    static final class Result {
        SpellAbility best;
        boolean override = false, screened = false;
        int playouts = 0;
        final List<String> scores = new ArrayList<>();
    }

    private static final class Stat {
        final SpellAbility sa;
        double sum = 0, sq = 0;
        int n = 0;
        Stat(SpellAbility sa) { this.sa = sa; }
        double mean() { return n == 0 ? Double.NEGATIVE_INFINITY : sum / n; }
        double var() { return n > 1 ? Math.max(0, (sq - n * mean() * mean()) / (n - 1)) : W * (double) W; }
        void add(double x) { if (!Double.isNaN(x)) { sum += x; sq += x * x; n++; } }
    }

    /**
     * Forge's own choice (`base`, null = pass) stands unless another candidate beats its average
     * by more than `z` standard errors of the difference: ties and noise leave the decision to Forge.
     *
     * Three economies (RESEARCH-PILOT-QUESTIONS-12OCT.md, Q1):
     *  - screen > 0: score every candidate once through the end of this turn; if the best leads the
     *    second by more than `screen`, the decision is clear and Forge's choice stands unsearched;
     *    otherwise only candidates within `screen` of the best (and Forge's) go on;
     *  - play-outs are raced by sequential halving: 2 each, drop the worse half, double, until one
     *    is left or `budget` play-outs are spent (Forge's choice always stays in the race);
     *  - `turns` is the horizon: 1 = to the start of my next turn, one full cycle.
     */
    static Result choose(Game game, Player me, SpellAbility base, List<SpellAbility> candidates, int budget, int turns, double z, int screen) {
        Result r = new Result();
        List<Stat> alive = new ArrayList<>();
        alive.add(new Stat(null)); // pass
        for (SpellAbility sa : candidates) alive.add(new Stat(sa));
        Stat baseStat = null;
        for (Stat st : alive) if (st.sa == base) baseStat = st;
        if (baseStat == null) return r;
        if (screen > 0) {
            List<double[]> quick = new ArrayList<>();
            for (int i = 0; i < alive.size(); i++) { double x = rollout(game, me, alive.get(i).sa, 0); r.playouts++; if (!Double.isNaN(x)) quick.add(new double[]{x, i}); }
            quick.sort((a, b) -> Double.compare(b[0], a[0]));
            if (quick.size() < 2 || quick.get(0)[0] - quick.get(1)[0] > screen) { r.screened = true; r.best = base; return r; }
            double top = quick.get(0)[0];
            List<Stat> keep = new ArrayList<>();
            for (double[] q : quick) if (top - q[0] <= screen) keep.add(alive.get((int) q[1]));
            if (!keep.contains(baseStat)) keep.add(baseStat);
            alive = keep;
        }
        int k = 2;
        while (r.playouts < budget) {
            for (Stat st : alive) for (int i = 0; i < k && r.playouts < budget; i++) { st.add(rollout(game, me, st.sa, turns)); r.playouts++; }
            if (alive.size() <= 2) { if (r.playouts >= budget || alive.size() == 1) break; continue; }
            alive.sort((a, b) -> Double.compare(b.mean(), a.mean()));
            List<Stat> next = new ArrayList<>(alive.subList(0, (alive.size() + 1) / 2));
            if (!next.contains(baseStat)) next.add(baseStat);
            alive = next;
            k *= 2;
        }
        Stat best = baseStat;
        for (Stat st : alive) if (st.n > 0 && st.mean() > best.mean()) best = st;
        for (Stat st : alive) r.scores.add((st == baseStat ? "*" : "") + (st.sa == null ? "pass" : st.sa.getHostCard().getName()) + "=" + Math.round(st.mean()) + "/" + st.n);
        r.best = best.sa;
        double se = Math.sqrt(best.var() / Math.max(1, best.n) + baseStat.var() / Math.max(1, baseStat.n));
        r.override = best != baseStat && baseStat.n > 0 && best.mean() - baseStat.mean() > z * Math.max(se, 1);
        return r;
    }
}
