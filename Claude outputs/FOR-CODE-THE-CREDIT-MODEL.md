# For Code: Justin Bjur and Faktoriee are not two collaborators

**The confusion is a data-model problem, not a content problem.** They are being treated as two
entities of the same kind who both worked on a thing. They are two entities of *different* kinds, and
both can appear on the same work without either being a duplicate or a co-credit.

---

## The two kinds

**Justin Bjur is a person, and the credit attaches to a role.**

The comparison is **Mark Ronson**: an artist who releases under his own name *and* produces for other
people, credited both ways, often on the same record. Justin is the one who takes role credits, and
he takes all of them — directing, acting, composing, performing, producing, writing. If a work has a
director and that director is him, the credit reads *Justin Bjur*. **He is the only one of the two
that a role can attach to.**

**Faktoriee is a publishing identity, and the credit attaches to the release.**

The comparison is **Moist Critikal**: the handle the work goes out under, distinct from the person
behind it. It is the channel tag. It leans production and visual — it is the name on the thing, not a
person in the room. **A role never attaches to Faktoriee.** It does not direct, does not compose,
does not perform.

## What that means in the schema

- **Not a join between two artists.** There is no "Justin Bjur & Faktoriee" collaboration record.
- **Two different fields, not two rows in one field.** Role credits (director, composer, performer,
  producer…) point at people. The channel/publisher field points at Faktoriee.
- **Both appearing on one work is normal and correct**, and should not be deduplicated, merged, or
  flagged as a conflict.
- **A work can have Faktoriee with no Justin role credit** — the channel publishes something he
  didn't perform on. The reverse is also possible: a Justin role credit on someone else's release,
  where Faktoriee is not the channel at all. **Neither implies the other.**
- **Display precedence follows the medium.** Music: *Justin Bjur* is the artist name. Video and
  channel: *Faktoriee* is the handle. A page that shows both should not present them as equals in the
  same list.

## The one-line version for whoever hits this next

> **Justin Bjur is who did it. Faktoriee is where it came out.**

---

## Four questions that change the model, and I do not have the answers

I have written the above from one description, so before Code builds to it:

1. **Is Faktoriee ever a role credit in practice?** Some channel identities do get credited as
   producer on their own output. If it happens even occasionally, it needs a field rather than a
   rule.
2. **Are there other people under Faktoriee**, or is it a solo identity? That decides whether it
   behaves like a label (many artists) or a handle (one person, one brand).
3. **Which name is canonical for search and metadata** — the thing that has to be right in an ID3
   tag, a YouTube channel field, a rights registration? That is usually one of them and not both.
4. **Is "Faktoriee" ever the artist name on music?** If yes, the medium rule above is too clean and
   needs an exception list.

Answer those and this becomes a spec rather than a description.
