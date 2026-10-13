package forge.bridge;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPOutputStream;

import com.google.common.eventbus.Subscribe;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import forge.LobbyPlayer;
import forge.ai.ComputerUtilAbility;
import forge.ai.simulation.GameStateEvaluator;
import forge.game.Game;
import forge.game.GameOutcome;
import forge.game.card.Card;
import forge.game.card.CardCollection;
import forge.game.card.CardView;
import forge.game.event.GameEventAttackersDeclared;
import forge.game.event.GameEventBlockersDeclared;
import forge.game.event.GameEventCombatEnded;
import forge.game.event.GameEventSpellAbilityCast;
import forge.game.event.GameEventTurnBegan;
import forge.game.event.GameEventTurnEnded;
import forge.game.keyword.Keyword;
import forge.game.player.Player;
import forge.game.player.PlayerView;
import forge.game.spellability.SpellAbility;
import forge.game.zone.ZoneType;

/**
 * starshard: the per-turn game log (RESEARCH-LEARNED-EVAL-13OCT.md), one gzipped JSON-lines file per
 * game. Built from Forge's own game events, so it records the same whoever decides (Forge or our
 * pilot), and costs nothing when off.
 *
 * Records, in order: "game" (who is who), then per turn "turn" (both seats' state at the start of
 * the turn, each seat's hand visible only in its own view, and Forge's static score of the position
 * for each seat), "cast" (every spell and ability put on the stack, with when), "attack", "block",
 * "combat" (what combat cost each side), "turn_end" (each seat's unspent mana and what it could have
 * cast), and finally "end" (the result). Never the library order or the opponent's hand: what a player
 * could see, so an evaluator trained on it can't learn to cheat.
 */
final class GameLog {
    private static final Gson GSON = new Gson();
    private static final Keyword[] KW = { Keyword.FLYING, Keyword.LIFELINK, Keyword.DEATHTOUCH, Keyword.FIRST_STRIKE, Keyword.DOUBLE_STRIKE,
            Keyword.MENACE, Keyword.TRAMPLE, Keyword.HEXPROOF, Keyword.INDESTRUCTIBLE, Keyword.VIGILANCE, Keyword.REACH, Keyword.HASTE, Keyword.FLASH };

    private final Game game;
    private final LobbyPlayer[] lobby;
    private final Writer out;
    private int turn = 0, owner = -1;
    private boolean closed = false;
    // combat bookkeeping: life and creatures each seat had when attackers were declared
    private int[] lifeAtAttack, creaturesAtAttack;
    private JsonArray attackers;

    private GameLog(Game game, LobbyPlayer[] lobby, Writer out) {
        this.game = game; this.lobby = lobby; this.out = out;
    }

    /** Starts a log for this game in dir (null: no log). Subscribes itself to the game's events. */
    static GameLog open(Path dir, Game game, LobbyPlayer[] lobby, int match, int gameNo, String[] decks) {
        if (dir == null) return null;
        try {
            Files.createDirectories(dir);
            Path f = dir.resolve(String.format("m%03d-g%d.jsonl.gz", match, gameNo));
            Writer w = new OutputStreamWriter(new GZIPOutputStream(new FileOutputStream(f.toFile())), StandardCharsets.UTF_8);
            GameLog log = new GameLog(game, lobby, w);
            JsonObject h = new JsonObject();
            h.addProperty("t", "game"); h.addProperty("match", match); h.addProperty("game", gameNo);
            JsonArray d = new JsonArray(); for (String s : decks) d.add(s); h.add("decks", d);
            log.write(h);
            game.subscribeToEvents(log);
            return log;
        } catch (IOException e) {
            System.err.println("[log] could not open a game log: " + e);
            return null;
        }
    }

    private int seatOf(Player p) { return p != null && p.getLobbyPlayer().equals(lobby[0]) ? 0 : 1; }
    private int seatOf(PlayerView pv) { for (Player p : game.getPlayers()) if (p.getView().equals(pv)) return seatOf(p); return -1; }
    private Player player(int seat) { for (Player p : game.getPlayers()) if (seatOf(p) == seat) return p; return null; }

    /**
     * Runs a record's work without touching the game: Forge's AI checks it calls (can this be paid
     * for, Forge's position score) draw from the shared random generator, which changed later games
     * (13 Oct 2026: same seeds, two of twelve games ran a different number of turns). The
     * generator's state is copied before and put back after.
     */
    private void quietly(Runnable r) {
        java.util.Random saved = copy(forge.util.MyRandom.getRandom());
        try { r.run(); }
        catch (RuntimeException e) { System.err.println("[log] " + e); }
        finally { if (saved != null) forge.util.MyRandom.setRandom(saved); }
    }
    private static java.util.Random copy(java.util.Random r) {
        try {
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            try (java.io.ObjectOutputStream o = new java.io.ObjectOutputStream(b)) { o.writeObject(r); }
            try (java.io.ObjectInputStream i = new java.io.ObjectInputStream(new java.io.ByteArrayInputStream(b.toByteArray()))) { return (java.util.Random) i.readObject(); }
        } catch (Exception e) { return null; }
    }

    private void write(JsonObject o) {
        if (closed) return;
        try { out.write(GSON.toJson(o)); out.write('\n'); } catch (IOException e) { /* a lost line, not a lost game */ }
    }

    private JsonObject base(String type) {
        JsonObject o = new JsonObject();
        o.addProperty("t", type);
        o.addProperty("turn", game.getPhaseHandler().getTurn());
        Player active = game.getPhaseHandler().getPlayerTurn();
        if (active != null) o.addProperty("active", seatOf(active));
        o.addProperty("phase", String.valueOf(game.getPhaseHandler().getPhase()));
        return o;
    }

    private static int mv(Card c) { try { return c.getCMC(); } catch (RuntimeException e) { return -1; } }

    /** A permanent as the record keeps it: what an evaluator's board features need. */
    private JsonObject permanent(Card c) {
        JsonObject o = new JsonObject();
        o.addProperty("name", c.getName());
        o.addProperty("seat", seatOf(c.getController()));
        String kind = c.isCreature() ? "creature" : c.isLand() ? "land" : c.isPlaneswalker() ? "planeswalker" : "other";
        o.addProperty("kind", kind);
        if (c.isTapped()) o.addProperty("tapped", true);
        if (c.isCreature()) {
            o.addProperty("power", c.getNetPower()); o.addProperty("toughness", c.getNetToughness());
            if (c.isSick()) o.addProperty("sick", true);
            JsonArray kw = new JsonArray();
            for (Keyword k : KW) if (c.hasKeyword(k)) kw.add(k.toString().toLowerCase());
            if (kw.size() > 0) o.add("kw", kw);
        }
        if (c.isPlaneswalker()) o.addProperty("loyalty", c.getCurrentLoyalty());
        int counters = c.getCounters().size(); // a multiset: every counter, all kinds
        if (counters > 0) o.addProperty("counters", counters);
        if (!c.isLand()) o.addProperty("mv", mv(c));
        return o;
    }

    /** What this seat could cast right now from its hand: name, mana value, instant speed. */
    private JsonArray castable(Player p) {
        JsonArray a = new JsonArray();
        CardCollection hand = new CardCollection(p.getCardsIn(ZoneType.Hand));
        for (Card c : hand) {
            if (c.isLand()) continue;
            boolean can = false;
            try {
                CardCollection one = new CardCollection(); one.add(c);
                for (SpellAbility sa : ComputerUtilAbility.getSpellAbilities(one, p)) {
                    if (!sa.isSpell()) continue;
                    sa.setActivatingPlayer(p);
                    if (Playability.affordable(sa, p) && Playability.hasRequiredTargets(sa)) { can = true; break; }
                }
            } catch (RuntimeException e) { /* unknown: not castable */ }
            if (!can) continue;
            JsonObject o = new JsonObject();
            o.addProperty("name", c.getName()); o.addProperty("mv", mv(c));
            if (c.isInstant() || c.hasKeyword(Keyword.FLASH)) o.addProperty("instant", true);
            a.add(o);
        }
        return a;
    }

    /** One seat's view: its own side in full, the other's public side and hand size. */
    private JsonObject side(Player p, boolean own) {
        JsonObject o = new JsonObject();
        o.addProperty("life", p.getLife());
        if (p.getPoisonCounters() > 0) o.addProperty("poison", p.getPoisonCounters());
        o.addProperty("library", p.getCardsIn(ZoneType.Library).size());
        o.addProperty("graveyard", p.getCardsIn(ZoneType.Graveyard).size());
        o.addProperty("exile", p.getCardsIn(ZoneType.Exile).size());
        o.addProperty("handSize", p.getCardsIn(ZoneType.Hand).size());
        if (own) {
            JsonArray h = new JsonArray();
            for (Card c : p.getCardsIn(ZoneType.Hand)) { JsonObject x = new JsonObject(); x.addProperty("name", c.getName()); x.addProperty("mv", c.isLand() ? -1 : mv(c)); h.add(x); }
            o.add("hand", h);
        }
        int lands = 0, untapped = 0;
        for (Card c : p.getCardsIn(ZoneType.Battlefield)) if (c.isLand()) { lands++; if (!c.isTapped()) untapped++; }
        o.addProperty("lands", lands); o.addProperty("landsUntapped", untapped);
        return o;
    }

    private int staticScore(Player p) {
        try { return new GameStateEvaluator().getScoreForGameState(game, p).value; } catch (RuntimeException e) { return Integer.MIN_VALUE; }
    }

    @Subscribe
    public void turnBegan(GameEventTurnBegan e) { quietly(() -> turnBegan0(e)); }
    private void turnBegan0(GameEventTurnBegan e) {
        turn = e.turnNumber(); owner = seatOf(e.turnOwner());
        JsonObject o = base("turn");
        JsonArray board = new JsonArray();
        for (Card c : game.getCardsIn(ZoneType.Battlefield)) board.add(permanent(c));
        o.add("board", board);
        JsonArray views = new JsonArray(), score = new JsonArray();
        for (int s = 0; s < 2; s++) {
            Player me = player(s), op = player(1 - s);
            if (me == null || op == null) return;
            JsonObject v = new JsonObject();
            v.add("me", side(me, true)); v.add("opp", side(op, false));
            views.add(v);
            int x = staticScore(me);
            if (x != Integer.MIN_VALUE) score.add(x); else score.add((Number) null);
        }
        o.add("views", views); // views[s] is seat s's view: its own hand, the other's count
        o.add("static", score);  // Forge's GameStateEvaluator score of the position, for each seat
        write(o);
    }

    @Subscribe
    public void cast(GameEventSpellAbilityCast e) { quietly(() -> cast0(e)); }
    private void cast0(GameEventSpellAbilityCast e) {
        try {
            CardView host = e.sa().getHostCard();
            JsonObject o = base("cast");
            o.addProperty("seat", seatOf(host.getController()));
            o.addProperty("name", host.getName());
            o.addProperty("spell", e.sa().isSpell());
            o.addProperty("stack", game.getStack().size());
            Card c = game.findById(host.getId());
            if (c != null) {
                o.addProperty("mv", mv(c));
                // what kind of card: the instant-speed statistics ask whether the opponent cast a threat
                o.addProperty("kind", c.isCreature() ? "creature" : c.isPlaneswalker() ? "planeswalker" : c.isInstant() ? "instant" : c.isSorcery() ? "sorcery" : c.isLand() ? "land" : "other");
                if (c.isInstant() || c.hasKeyword(Keyword.FLASH)) o.addProperty("instant", true);
            }
            write(o);
        } catch (RuntimeException ex) { /* a missed cast line */ }
    }

    @Subscribe
    public void attackers(GameEventAttackersDeclared e) { quietly(() -> attackers0(e)); }
    private void attackers0(GameEventAttackersDeclared e) {
        lifeAtAttack = new int[2]; creaturesAtAttack = new int[2]; attackers = new JsonArray();
        for (int s = 0; s < 2; s++) { Player p = player(s); if (p == null) return; lifeAtAttack[s] = p.getLife(); creaturesAtAttack[s] = p.getCreaturesInPlay().size(); }
        if (game.getPhaseHandler().getCombat() == null) return;
        for (Card a : game.getPhaseHandler().getCombat().getAttackers()) {
            JsonObject x = new JsonObject(); x.addProperty("name", a.getName()); x.addProperty("power", a.getNetPower()); x.addProperty("toughness", a.getNetToughness()); attackers.add(x);
        }
        JsonObject o = base("attack");
        o.addProperty("seat", seatOf(e.player()));
        o.add("attackers", attackers);
        o.addProperty("untappedDefenders", (int) player(1 - seatOf(e.player())).getCreaturesInPlay().stream().filter(c -> !c.isTapped()).count());
        write(o);
    }

    private static final Keyword[] COMBAT_KW = { Keyword.FIRST_STRIKE, Keyword.DOUBLE_STRIKE, Keyword.DEATHTOUCH, Keyword.INDESTRUCTIBLE, Keyword.TRAMPLE };
    private static JsonArray combatKw(Card c) { JsonArray a = new JsonArray(); for (Keyword k : COMBAT_KW) if (c.hasKeyword(k)) a.add(k.toString().toLowerCase()); return a; }

    @Subscribe
    public void blockers(GameEventBlockersDeclared e) { quietly(() -> blockers0(e)); }
    private void blockers0(GameEventBlockersDeclared e) {
        if (game.getPhaseHandler().getCombat() == null) return;
        JsonArray blocks = new JsonArray();
        for (Card a : game.getPhaseHandler().getCombat().getAttackers())
            for (Card b : game.getPhaseHandler().getCombat().getBlockers(a)) {
                JsonObject x = new JsonObject();
                x.addProperty("blocker", b.getName()); x.addProperty("bp", b.getNetPower()); x.addProperty("bt", b.getNetToughness());
                x.addProperty("attacker", a.getName()); x.addProperty("ap", a.getNetPower()); x.addProperty("at", a.getNetToughness());
                // the keywords that decide who dies in a block
                JsonArray bk = combatKw(b), ak = combatKw(a);
                if (bk.size() > 0) x.add("bkw", bk);
                if (ak.size() > 0) x.add("akw", ak);
                blocks.add(x);
            }
        JsonObject o = base("block");
        o.addProperty("seat", seatOf(e.defendingPlayer()));
        o.add("blocks", blocks);
        write(o);
    }

    @Subscribe
    public void combatEnded(GameEventCombatEnded e) { quietly(() -> combatEnded0(e)); }
    private void combatEnded0(GameEventCombatEnded e) {
        if (lifeAtAttack == null) return;
        JsonObject o = base("combat");
        JsonArray life = new JsonArray(), lost = new JsonArray();
        for (int s = 0; s < 2; s++) {
            Player p = player(s); if (p == null) return;
            life.add(p.getLife() - lifeAtAttack[s]);
            lost.add(Math.max(0, creaturesAtAttack[s] - p.getCreaturesInPlay().size()));
        }
        o.add("lifeChange", life);       // per seat
        o.add("creaturesLost", lost);    // per seat, net of creatures entering during combat
        write(o);
        lifeAtAttack = null;
    }

    @Subscribe
    public void turnEnded(GameEventTurnEnded e) { quietly(() -> turnEnded0(e)); }
    private void turnEnded0(GameEventTurnEnded e) {
        // Forge fires this after handing the turn on: the turn and its owner are the ones that just ended
        JsonObject o = base("turn_end");
        o.addProperty("turn", turn); o.addProperty("active", owner);
        JsonArray seats = new JsonArray();
        for (int s = 0; s < 2; s++) {
            Player p = player(s); if (p == null) return;
            JsonObject x = new JsonObject();
            int untapped = 0; for (Card c : p.getCardsIn(ZoneType.Battlefield)) if (c.isLand() && !c.isTapped()) untapped++;
            x.addProperty("landsUntapped", untapped);
            x.addProperty("manaAvailable", Playability.availableMana(null, p));
            x.add("castable", castable(p));
            x.addProperty("handSize", p.getCardsIn(ZoneType.Hand).size());
            seats.add(x);
        }
        o.add("seats", seats);
        write(o);
    }

    /** The result, then the file is closed. */
    void close(GameOutcome outcome, LobbyPlayer[] lobby, String reason, boolean slow, Integer onThePlay) {
        JsonObject o = new JsonObject();
        o.addProperty("t", "end");
        if (outcome != null && !outcome.isDraw() && outcome.getWinningLobbyPlayer() != null) o.addProperty("winner", outcome.getWinningLobbyPlayer().equals(lobby[0]) ? 0 : 1);
        o.addProperty("turns", outcome != null ? outcome.getLastTurnNumber() : game.getPhaseHandler().getTurn());
        if (onThePlay != null) o.addProperty("onThePlay", onThePlay);
        o.addProperty("reason", reason);
        if (slow) o.addProperty("slow", true);
        JsonArray life = new JsonArray();
        for (int s = 0; s < 2; s++) { Player p = player(s); life.add(p == null ? 0 : p.getLife()); }
        o.add("life", life);
        write(o);
        closed = true; // the game object is dropped after this; any late event writes nothing
        try { out.close(); } catch (IOException e) { /* nothing more to do */ }
    }
}
