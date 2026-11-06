// account.jsx: the account pages (SS8, 1 Nov 2026). Sign in, sign up with the age check
// first, forgot and reset, the verify-email landing, and the account page: the chart the
// account keeps, a copy of the data, the password, sign out, delete. Archetype C from
// APP-FRAMEWORK.md: a page header, one form or one column of rows, the doors under it.
// The voice is the game's own sign-in ("welcome back", "the road remembers you"); every
// call goes through api.js; who is signed in lives in account.js.
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from './router.jsx';
import { ROUTES } from './routes.mjs';
import * as api from '../../api.js';
import { apiReachable, refreshMe, setMe, signOut, words } from './account.js';
import { useBirth, birthWords, clearBirthLocal } from './birth.js';

const byKey = Object.fromEntries(ROUTES.map(r => [r.key, r]));
const today = () => new Date().toISOString().slice(0, 10);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-z0-9_]{3,20}$/;

function PageHead({ eyebrow, title, lead, children }) {
  return (
    <>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
      {children}
    </>
  );
}

function Field({ id, label, note, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {note ? <p className="field-note">{note}</p> : null}
    </div>
  );
}

function Err({ children }) {
  return children ? <p className="form-err" role="alert">{children}</p> : null;
}

/** Where to go after a sign in or a sign up: ?next=/shard when the door said so. */
// "nothing of it stays on this device": with the account gone from the server, what the shell
// and the game kept for it on this origin goes too. The game at /play/ writes its progress,
// the birth record and the signed-in name under manzil-v2-* (and its settings under manzil-*),
// the shell the first-run flag and the email-left marker (MZ3; its row went with the account).
// The sky cache (starshard-tonight) and the device's own id are nobody's data and stay.
function clearDeviceAfterDelete() {
  try {
    const gone = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('manzil-') || k === 'starshard-burst-seen' || k === 'starshard-email-left')) gone.push(k);
    }
    for (const k of gone) localStorage.removeItem(k);
  } catch (x) { /* private mode: nothing was kept */ }
}

function nextAfter() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    return n && n.startsWith('/') && !n.startsWith('//') ? n : '/account';
  } catch (e) { return '/account'; }
}

function offline() {
  return apiReachable() ? '' : words('unreachable');
}

// ─── sign in ─────────────────────────────────────────────────────────────────────────────
export function SignIn({ me }) {
  const { navigate } = useRouter();
  const [who, setWho] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (me) navigate(nextAfter(), { replace: true }); }, [me]);

  const submit = async e => {
    e.preventDefault();
    const v = who.trim();
    if (!v) { setErr('your email or your name first.'); return; }
    if (!pass) { setErr('and the password.'); return; }
    if (offline()) { setErr(offline()); return; }
    setBusy(true); setErr('');
    try {
      if (v.includes('@')) await api.login(v, pass); else await api.loginWithUsername(v.toLowerCase(), pass);
      await refreshMe();
      navigate(nextAfter(), { replace: true });
    } catch (x) {
      setBusy(false);
      setErr(words(x.code, "that name and password don't match."));
    }
  };

  return (
    <>
      <PageHead eyebrow="welcome back" title={byKey.signin.title} lead="the road remembers you." />
      <form className="account-form" onSubmit={submit} noValidate>
        <Field id="si-who" label="email or name">
          <input id="si-who" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={who} onChange={e => { setWho(e.target.value); setErr(''); }} />
        </Field>
        <Field id="si-pass" label="password">
          <input id="si-pass" type="password" autoComplete="current-password" value={pass} onChange={e => { setPass(e.target.value); setErr(''); }} />
        </Field>
        <Err>{err}</Err>
        <div className="doors">
          <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'signing in' : 'sign in ›'}</button>
        </div>
      </form>
      <p className="note">new here? <Link href="/signup">sign up</Link> · forgot your password? <Link href="/reset">reset it</Link></p>
    </>
  );
}

// ─── sign up ─────────────────────────────────────────────────────────────────────────────
// The age check first, before any other field is shown (STARSHARD-LAUNCH.md section 3.4):
// the birth date alone, asked of the server; only a date old enough opens the rest. The
// chart cast on this device goes with the account when its date is the one checked.
export function SignUp({ me }) {
  const { navigate } = useRouter();
  const [birth] = useBirth(me);
  const [step, setStep] = useState('age'); // age · fields · young
  const [date, setDate] = useState(() => (birth && birth.birthDate) || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const seeded = useRef(!!(birth && birth.birthDate));

  useEffect(() => { if (me) navigate('/account', { replace: true }); }, [me]);
  // the device's record may arrive after the first render (a signed-in visitor's comes from
  // the server); seed the date once, and never over a date the visitor typed
  useEffect(() => { if (!seeded.current && birth && birth.birthDate) { seeded.current = true; setDate(birth.birthDate); } }, [birth]);

  const withRecord = !!(birth && birth.birthDate === date);

  const checkAge = async e => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today() || date < '1900-01-01') { setErr("the sky can't read that date."); return; }
    if (offline()) { setErr(offline()); return; }
    setBusy(true); setErr('');
    try {
      const { ok } = await api.ageCheck(date);
      setBusy(false);
      setStep(ok ? 'fields' : 'young');
    } catch (x) {
      setBusy(false);
      setErr(words(x.code));
    }
  };

  const submit = async e => {
    e.preventDefault();
    const un = name.trim().toLowerCase();
    const em = email.trim().toLowerCase();
    if (!NAME_RE.test(un)) { setErr(un ? words('invalid_username') : 'the road needs a name to call you.'); return; }
    if (!EMAIL_RE.test(em)) { setErr('a way to reach you, for the nights that matter.'); return; }
    if (pass.length < 8) { setErr('eight characters or more.'); return; }
    if (offline()) { setErr(offline()); return; }
    setBusy(true); setErr('');
    const extra = withRecord
      ? { username: un, birthDate: date, birthTime: birth.birthTimeKnown === false ? null : birth.birthTime, birthTimeKnown: birth.birthTimeKnown !== false, placeName: birth.placeName || null, lat: Number.isFinite(birth.lat) ? birth.lat : null, lon: Number.isFinite(birth.lon) ? birth.lon : null, birthTz: birth.tz || null }
      : { username: un, birthDate: date, birthTimeKnown: false };
    try {
      await api.signup(em, pass, extra);
      await refreshMe();
      navigate(nextAfter(), { replace: true });
    } catch (x) {
      setBusy(false);
      if (x.code === 'too_young') { setStep('young'); return; }
      setErr(words(x.code, 'could not make the account. try again.'));
    }
  };

  if (step === 'young') {
    return (
      <>
        <PageHead eyebrow="keep this" title={byKey.signup.title} />
        <p className="form-err su-young" role="alert">{words('too_young')}</p>
        <p className="prose">the sky is still yours to read: tonight, the chart and the codex ask for no account.</p>
        <div className="doors">
          <Link className="button" href="/tonight">tonight's sky</Link>
          <button type="button" className="button ghost su-retry" onClick={() => { setStep('age'); setErr(''); }}>the date was wrong</button>
        </div>
      </>
    );
  }

  if (step === 'age') {
    return (
      <>
        <PageHead eyebrow="keep this" title={byKey.signup.title} lead="the date you were born, first; the rest after." />
        <form className="account-form su-age" onSubmit={checkAge} noValidate>
          <Field id="su-date" label="the date you were born" note={withRecord ? `the chart on this device: ${birthWords(birth)}` : ''}>
            <input id="su-date" type="date" value={date} min="1900-01-01" max={today()} required onChange={e => { setDate(e.target.value); setErr(''); }} />
          </Field>
          <Err>{err}</Err>
          <div className="doors">
            <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'asking the sky' : 'next ›'}</button>
          </div>
        </form>
        <p className="note">already have an account? <Link href="/signin">sign in</Link></p>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="keep this" title={byKey.signup.title} lead={byKey.signup.description} />
      <form className="account-form su-fields" onSubmit={submit} noValidate>
        <p className="prose su-birth">
          {withRecord
            ? <>your chart goes with the account: {birthWords(birth)}. <Link href="/chart">change it</Link></>
            : <>born {birthWords({ birthDate: date, birthTimeKnown: false }).replace(', time not known', '')}. cast your chart once the account exists; it is kept with it.</>}
        </p>
        <Field id="su-name" label="a name" note="3 to 20 letters, numbers or underscores. the game calls you by it.">
          <input id="su-name" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
        </Field>
        <Field id="su-email" label="email" note="for a lost password, and nothing else until you say so.">
          <input id="su-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} />
        </Field>
        <Field id="su-pass" label="password" note="eight characters or more.">
          <input id="su-pass" type="password" autoComplete="new-password" value={pass} onChange={e => { setPass(e.target.value); setErr(''); }} />
        </Field>
        <Err>{err}</Err>
        <div className="doors">
          <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'making the account' : 'make the account ›'}</button>
          <button type="button" className="button ghost" onClick={() => { setStep('age'); setErr(''); }}>back</button>
        </div>
        <p className="note su-terms">making an account agrees to the <a href="/terms/">terms</a>; the <a href="/privacy/">privacy page</a> says what is kept and why.</p>
      </form>
      <p className="note">already have an account? <Link href="/signin">sign in</Link></p>
    </>
  );
}

// ─── forgot and reset ────────────────────────────────────────────────────────────────────
// One route, two states. Without a token, the ask: an email, and the same answer whether or
// not it has an account. With #resetToken=... (the link in the mail), the new password.
function tokenFromHash(key) {
  try {
    const h = window.location.hash || '';
    const m = h.match(new RegExp(`^#${key}=([A-Za-z0-9._-]+)`));
    return m ? m[1] : '';
  } catch (e) { return ''; }
}

export function Reset() {
  const { navigate } = useRouter();
  const [token] = useState(() => tokenFromHash('resetToken'));
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const ask = async e => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { setErr('the email the account was made with.'); return; }
    if (offline()) { setErr(offline()); return; }
    setBusy(true); setErr('');
    try {
      await api.forgotPassword(em);
      setBusy(false); setSent(true);
    } catch (x) {
      setBusy(false);
      setErr(words(x.code, 'could not send that mail. try again.'));
    }
  };

  const reset = async e => {
    e.preventDefault();
    if (pass.length < 8) { setErr('eight characters or more.'); return; }
    if (pass !== again) { setErr('the two passwords differ.'); return; }
    if (offline()) { setErr(offline()); return; }
    setBusy(true); setErr('');
    try {
      await api.resetPassword(token, pass);
      try { window.history.replaceState(null, '', window.location.pathname); } catch (x) { /* the token stays in the bar */ }
      await refreshMe();
      navigate('/account', { replace: true });
    } catch (x) {
      setBusy(false);
      setErr(words(x.code, 'could not reset the password. try again.'));
    }
  };

  if (token) {
    return (
      <>
        <PageHead eyebrow="your account" title={byKey.reset.title} lead="choose a new password. every other device is signed out when it is set." />
        <form className="account-form rs-new" onSubmit={reset} noValidate>
          <Field id="rs-pass" label="new password" note="eight characters or more.">
            <input id="rs-pass" type="password" autoComplete="new-password" value={pass} onChange={e => { setPass(e.target.value); setErr(''); }} />
          </Field>
          <Field id="rs-again" label="once more">
            <input id="rs-again" type="password" autoComplete="new-password" value={again} onChange={e => { setAgain(e.target.value); setErr(''); }} />
          </Field>
          <Err>{err}</Err>
          <div className="doors">
            <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'setting it' : 'set the password ›'}</button>
            {err ? <Link className="button ghost" href="/reset">ask for a new link</Link> : null}
          </div>
        </form>
      </>
    );
  }

  if (sent) {
    return (
      <>
        <PageHead eyebrow="your account" title="check your mail" lead="if that address has an account, a link to set a new password is on its way. it works for thirty minutes." />
        <p className="note rs-sent">nothing arrived? the address may differ from the one the account was made with, or the mail is in a spam folder.</p>
        <div className="doors">
          <Link className="button ghost" href="/signin">sign in</Link>
          <Link className="button ghost" href="/">home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="your account" title="forgot your password" lead="a link to set a new one goes to the email the account was made with." />
      <form className="account-form rs-ask" onSubmit={ask} noValidate>
        <Field id="rs-email" label="email">
          <input id="rs-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} />
        </Field>
        <Err>{err}</Err>
        <div className="doors">
          <button type="submit" className="button" disabled={busy} aria-busy={busy || undefined}>{busy ? 'sending' : 'send the link ›'}</button>
        </div>
      </form>
      <p className="note">remembered it? <Link href="/signin">sign in</Link></p>
    </>
  );
}

// ─── the verify-email landing ────────────────────────────────────────────────────────────
// Confirms the address from the token in the link (#verifyEmail=...). Confirmation gates
// nothing; it is what lets a reset link reach the person.
export function Verify({ me }) {
  const [token] = useState(() => tokenFromHash('verifyEmail'));
  const [state, setState] = useState(token ? 'checking' : 'none'); // checking · done · failed · none · resent
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let live = true;
    if (!apiReachable()) { setState('failed'); setErr(words('unreachable')); return undefined; }
    api.verifyEmail(token).then(() => {
      if (!live) return;
      try { window.history.replaceState(null, '', window.location.pathname); } catch (x) { /* the token stays in the bar */ }
      setState('done');
      refreshMe();
    }).catch(x => { if (live) { setState('failed'); setErr(words(x.code, 'that link did not work.')); } });
    return () => { live = false; };
  }, [token]);

  const resend = async () => {
    if (offline()) { setErr(offline()); return; }
    try { await api.resendVerification(); setState('resent'); setErr(''); }
    catch (x) { setErr(words(x.code, 'could not send the mail. try again.')); }
  };

  if (state === 'checking') return <PageHead eyebrow="your account" title="confirming" lead="one moment." />;
  if (state === 'done') {
    return (
      <>
        <PageHead eyebrow="your account" title={byKey.verify.title} lead={byKey.verify.description} />
        <div className="doors">
          <Link className="button" href="/tonight">tonight's sky</Link>
          <Link className="button ghost" href={me ? '/account' : '/signin'}>{me ? 'your account' : 'sign in'}</Link>
        </div>
      </>
    );
  }
  if (state === 'resent') {
    return <PageHead eyebrow="your account" title="check your mail" lead={`a new confirmation link is on its way to ${me ? me.email : 'your address'}. it works for a day.`} />;
  }
  const failed = state === 'failed';
  return (
    <>
      <PageHead eyebrow="your account" title={failed ? 'that link has expired' : 'confirm your email'} lead={failed ? 'confirmation links work for a day.' : 'the link in the mail confirms your address.'} />
      {failed && err ? <p className="form-err" role="alert">{err}</p> : null}
      <div className="doors">
        {me ? <button type="button" className="button" onClick={resend}>send the confirmation again</button> : <Link className="button" href="/signin">sign in</Link>}
        <Link className="button ghost" href="/">home</Link>
      </div>
    </>
  );
}

// ─── the account page ────────────────────────────────────────────────────────────────────
export function Account({ me }) {
  const { navigate } = useRouter();
  const [birth] = useBirth(me);
  const [status, setStatus] = useState({});
  const [delPass, setDelPass] = useState('');
  const [delErr, setDelErr] = useState('');
  const [busy, setBusy] = useState('');
  const [gone, setGone] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const say = (k, v) => setStatus(s => ({ ...s, [k]: v }));

  // MZ4: the game's pause menu links straight to a section of this page ("a copy of your
  // data" to #acct-data-h, "delete the account" to #acct-del-h). The page renders once `me`
  // is known, after the browser's own jump to the hash would have found nothing, so the
  // scroll happens here; the delete section is a fold and opens when it is the destination.
  useEffect(() => {
    if (!me) return;
    const id = (window.location.hash || '').slice(1);
    if (id !== 'acct-data-h' && id !== 'acct-del-h') return;
    if (id === 'acct-del-h') setDelOpen(true);
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [me]);

  if (gone) {
    return (
      <>
        <PageHead eyebrow="you" title="your account is gone" lead="the chart, the shard and the game's progress went with it. nothing of it stays on this device." />
        <div className="doors">
          <Link className="button" href="/">home</Link>
          <Link className="button ghost" href="/tonight">tonight's sky</Link>
        </div>
      </>
    );
  }

  if (me === undefined) return <PageHead eyebrow="you" title={byKey.account.title} lead="checking who you are." />;

  if (!me) {
    return (
      <>
        <PageHead eyebrow="you" title={byKey.account.title} lead="sign in to see the chart your account keeps, take a copy of your data, or close the account." />
        <div className="doors">
          <Link className="button" href="/signin">sign in</Link>
          <Link className="button ghost" href="/signup">sign up</Link>
        </div>
      </>
    );
  }

  const exportData = async () => {
    setBusy('export'); say('export', '');
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'star-shard-data.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      say('export', 'downloaded: star-shard-data.json, every field the account holds.');
    } catch (x) {
      say('export', words(x.code, 'could not make the copy. try again.'));
    }
    setBusy('');
  };

  const resetLink = async () => {
    setBusy('reset'); say('reset', '');
    try { await api.forgotPassword(me.email); say('reset', `a link is on its way to ${me.email}. it works for thirty minutes.`); }
    catch (x) { say('reset', words(x.code, 'could not send the link. try again.')); }
    setBusy('');
  };

  const resend = async () => {
    setBusy('verify'); say('verify', '');
    try { await api.resendVerification(); say('verify', `a confirmation link is on its way to ${me.email}. it works for a day.`); }
    catch (x) { say('verify', words(x.code, 'could not send the mail. try again.')); }
    setBusy('');
  };

  const out = async () => {
    setBusy('out');
    await signOut();
    navigate('/', { replace: true });
  };

  const del = async e => {
    e.preventDefault();
    if (!delPass) { setDelErr('your password, to be sure.'); return; }
    setBusy('delete'); setDelErr('');
    try {
      await api.deleteAccount(delPass);
      clearBirthLocal();
      clearDeviceAfterDelete();
      setMe(null);
      setGone(true);
    } catch (x) {
      setBusy('');
      setDelErr(words(x.code, 'could not delete the account. try again.'));
    }
  };

  return (
    <>
      <PageHead eyebrow="you" title={me.username}>
        <p className="lead acct-email">{me.email}{me.emailVerified ? '' : ', not yet confirmed'}</p>
      </PageHead>

      <section className="acct" aria-labelledby="acct-chart-h">
        <h2 id="acct-chart-h" className="section-h">your chart</h2>
        {birth
          ? <p className="prose acct-birth">{birthWords(birth)}. the chart and the shard are cast from it, here and on any device you sign in on.</p>
          : <p className="prose acct-birth">no chart yet. cast one and it is kept with the account.</p>}
        <div className="doors">
          <Link className="button" href="/chart">{birth ? 'open your chart' : 'cast your chart'}</Link>
          {birth ? <Link className="button ghost" href="/shard">your shard</Link> : null}
          <Link className="button ghost" href="/play/" external>play</Link>
        </div>
      </section>

      <section className="acct" aria-labelledby="acct-data-h">
        <h2 id="acct-data-h" className="section-h">your data</h2>
        <p className="prose">one file, machine-readable, with every field the account holds: the birth record, the game's progress, the account itself.</p>
        <div className="doors">
          <button type="button" className="button ghost acct-export" onClick={exportData} disabled={busy === 'export'} aria-busy={busy === 'export' || undefined}>{busy === 'export' ? 'making the copy' : 'keep a copy of your data'}</button>
        </div>
        {status.export ? <p className="note acct-status" role="status">{status.export}</p> : null}
      </section>

      <section className="acct" aria-labelledby="acct-pass-h">
        <h2 id="acct-pass-h" className="section-h">your password</h2>
        <p className="prose">a link to set a new one goes to {me.email}.</p>
        <div className="doors">
          <button type="button" className="button ghost acct-reset" onClick={resetLink} disabled={busy === 'reset'} aria-busy={busy === 'reset' || undefined}>{busy === 'reset' ? 'sending' : 'send a reset link'}</button>
        </div>
        {status.reset ? <p className="note acct-status" role="status">{status.reset}</p> : null}
      </section>

      {!me.emailVerified ? (
        <section className="acct" aria-labelledby="acct-mail-h">
          <h2 id="acct-mail-h" className="section-h">your email</h2>
          <p className="prose">{me.email} is not yet confirmed. the confirmation is what lets a reset link reach you; the sky, the chart and the game ask for nothing more.</p>
          <div className="doors">
            <button type="button" className="button ghost acct-verify" onClick={resend} disabled={busy === 'verify'} aria-busy={busy === 'verify' || undefined}>{busy === 'verify' ? 'sending' : 'send the confirmation again'}</button>
          </div>
          {status.verify ? <p className="note acct-status" role="status">{status.verify}</p> : null}
        </section>
      ) : null}

      <section className="acct" aria-labelledby="acct-out-h">
        <h2 id="acct-out-h" className="section-h">this device</h2>
        <p className="prose">signing out leaves the chart on this device and takes the account off it.</p>
        <div className="doors">
          <button type="button" className="button ghost acct-signout" onClick={out} disabled={busy === 'out'} aria-busy={busy === 'out' || undefined}>{busy === 'out' ? 'signing out' : 'sign out'}</button>
        </div>
      </section>

      <section className="acct acct-danger" aria-labelledby="acct-del-h">
        <h2 id="acct-del-h" className="section-h">delete the account</h2>
        <details className="acct-fold" open={delOpen || undefined} onToggle={e => setDelOpen(e.target.open)}>
          <summary>delete {me.username}</summary>
          <form className="account-form" onSubmit={del} noValidate>
            <p className="prose">permanent and immediate: the chart, the shard and the game's progress go with it and cannot be brought back. it asks for your password first.</p>
            <Field id="del-pass" label="your password">
              <input id="del-pass" type="password" autoComplete="current-password" value={delPass} onChange={e => { setDelPass(e.target.value); setDelErr(''); }} />
            </Field>
            <Err>{delErr}</Err>
            <div className="doors">
              <button type="submit" className="button danger acct-delete" disabled={busy === 'delete'} aria-busy={busy === 'delete' || undefined}>{busy === 'delete' ? 'deleting' : 'delete my account'}</button>
            </div>
          </form>
        </details>
      </section>

      <p className="note">the <a href="/privacy/">privacy page</a> says what is kept and why; the <a href="/terms/">terms</a> are short.</p>
    </>
  );
}
