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
 * Version 1 known shortcut: a copy keeps the opponent's real hand, so play-outs see it.
 */
final class Search {
    private Search() {}

    static final boolean TRACE = "1".equals(System.getenv("SEARCH_TRACE"));

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

    static int rel(Game g, Player me) {
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
        boolean override = false;
        final List<String> scores = new ArrayList<>();
    }

    /**
     * Forge's own choice (`base`, null = pass) stands unless another candidate beats its average
     * by more than `z` standard errors of the difference: ties and noise leave the decision to Forge.
     */
    static Result choose(Game game, Player me, SpellAbility base, List<SpellAbility> candidates, int rollouts, int turns, double z) {
        Result r = new Result();
        double bestScore = Double.NEGATIVE_INFINITY, baseScore = Double.NaN, bestVar = 0, baseVar = 0;
        int bestN = 0, baseN = 0;
        List<SpellAbility> all = new ArrayList<>();
        all.add(null); // pass
        all.addAll(candidates);
        for (SpellAbility sa : all) {
            double sum = 0, sq = 0;
            int n = 0;
            for (int i = 0; i < rollouts; i++) {
                double x = rollout(game, me, sa, turns);
                if (!Double.isNaN(x)) { sum += x; sq += x * x; n++; }
            }
            if (n == 0) continue;
            double avg = sum / n, var = n > 1 ? Math.max(0, (sq - n * avg * avg) / (n - 1)) : W * (double) W;
            r.scores.add((sa == base ? "*" : "") + (sa == null ? "pass" : sa.getHostCard().getName()) + "=" + Math.round(avg) + "/" + n);
            if (sa == base) { baseScore = avg; baseVar = var; baseN = n; }
            if (avg > bestScore) { bestScore = avg; bestVar = var; bestN = n; r.best = sa; }
        }
        double se = Math.sqrt(bestVar / Math.max(1, bestN) + baseVar / Math.max(1, baseN));
        r.override = !Double.isNaN(baseScore) && r.best != base && bestScore - baseScore > z * Math.max(se, 1);
        return r;
    }
}
