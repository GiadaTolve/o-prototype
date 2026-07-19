"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { YumeMessageText, type YumeLinkHandlers } from "./YumeMessageText";
import {
  clearYumeSession,
  createFreshSession,
  isAffirmativeDreamAnswer,
  isContinuationInput,
  loadYumeSession,
  parseYesNo,
  saveYumeSession,
  validateCharacterName,
  validateEmail,
  type StoredChatMessage,
  type YumeRegisterSession,
  type YumeUserData,
} from "./yume-register-session";
import { getDevicePayload } from "@/lib/device-fingerprint";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type FlowMessage = { text: string | ((data: YumeUserData) => string); delay: number };

type ChatMessage = { content: React.ReactNode; sender: "yume" | "user"; plain?: string };

const OPENING: FlowMessage[] = [
  { text: "Hey ✨ Se sei arrivat* fin qui, hai deciso di fare un passo fuori dalla realtà.", delay: 800 },
  { text: "...", delay: 1200 },
  { text: "Beh, benvenut*!", delay: 800 },
  {
    text: 'Prima di aprirti la porta, però, una formalità — le porte serie hanno sempre un buttafuori.\nSei maggiorenne? Rispondi solo "sì" o "no".',
    delay: 1400,
  },
];

async function checkNameAvailable(name: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/check-character-name?name=${encodeURIComponent(name.trim())}`);
  if (!res.ok) return false;
  const body = (await res.json()) as { available?: boolean };
  return body.available === true;
}

export function LandingRegisterForm({
  onRegisterSuccess,
  onOpenGuida,
  onOpenLore,
  onOpenPrivacy,
  onOpenPrincipia,
  onOpenLogin,
}: {
  onRegisterSuccess: (token: string) => void;
  onOpenGuida: () => void;
  onOpenLore: () => void;
  onOpenPrivacy: () => void;
  onOpenPrincipia: () => void;
  onOpenLogin: () => void;
}) {
  const [session, setSession] = useState<YumeRegisterSession>(() => loadYumeSession() ?? createFreshSession());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isYumeTyping, setIsYumeTyping] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [showYesNo, setShowYesNo] = useState(false);
  const [showRecapButtons, setShowRecapButtons] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  /** Stato locale: non persistere — evita sessione bloccata su refresh durante il redirect. */
  const [isFinishing, setIsFinishing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionRef = useRef(session);
  const fixFieldRef = useRef<"name" | "email" | null>(null);
  const registeredTokenRef = useRef<string | null>(null);
  sessionRef.current = session;

  const linkHandlers: YumeLinkHandlers = {
    onOpenPrivacy,
    onOpenPrincipia,
    onOpenGuida,
    onOpenLore,
    onOpenLogin,
  };

  const persist = useCallback((patch: Partial<YumeRegisterSession>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      saveYumeSession(next);
      return next;
    });
  }, []);

  const renderYume = useCallback(
    (text: string) => <YumeMessageText text={text} handlers={linkHandlers} />,
    [linkHandlers],
  );

  const addMessage = useCallback(
    (content: React.ReactNode, sender: "yume" | "user", plain?: string) => {
      const entry: StoredChatMessage = {
        sender,
        text: plain ?? (typeof content === "string" ? content : ""),
      };
      setMessages((prev) => [...prev, { content, sender, plain: entry.text }]);
      setSession((prev) => {
        const next = { ...prev, messages: [...prev.messages, entry] };
        saveYumeSession(next);
        return next;
      });
    },
    [],
  );

  const clearAllTimers = useCallback(() => {
    activeTimers.current.forEach((t) => clearTimeout(t));
    activeTimers.current = [];
  }, []);

  const playMessageSequence = useCallback(
    (messageList: FlowMessage[] = [], onComplete?: () => void) => {
      clearAllTimers();
      setIsYumeTyping(true);
      setShowYesNo(false);
      setShowRecapButtons(false);
      let totalDelay = 0;
      messageList.forEach(({ text, delay }) => {
        const timer = setTimeout(() => {
          const messageText = typeof text === "function" ? text(sessionRef.current.userData) : text;
          addMessage(renderYume(messageText), "yume", messageText);
        }, totalDelay + delay);
        activeTimers.current.push(timer);
        totalDelay += delay;
      });
      const finalTimer = setTimeout(() => {
        setIsYumeTyping(false);
        onComplete?.();
      }, totalDelay + 400);
      activeTimers.current.push(finalTimer);
    },
    [addMessage, clearAllTimers, renderYume],
  );

  const finishYesNoStep = useCallback(
    (nextStep: number, msgs: FlowMessage[], patch?: Partial<YumeRegisterSession>) => {
      if (patch) persist({ ...patch, yesNoFailCount: 0 });
      else persist({ yesNoFailCount: 0 });
      playMessageSequence(msgs, () => {
        persist({ step: nextStep });
        setIsInputDisabled(false);
      });
    },
    [persist, playMessageSequence],
  );

  const handleYesNoAmbiguous = useCallback(
    (errorText: string, onStay: () => void) => {
      const fails = sessionRef.current.yesNoFailCount + 1;
      persist({ yesNoFailCount: fails });
      if (fails >= 2) setShowYesNo(true);
      playMessageSequence([{ text: errorText, delay: 400 }], () => {
        onStay();
        setIsInputDisabled(false);
      });
    },
    [persist, playMessageSequence],
  );

  const autoLoginAndFinish = useCallback(
    async (data: YumeUserData) => {
      const device = getDevicePayload();
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomePg: data.nomePg, password: data.password, ...device }),
      });
      const loginBody = (await loginRes.json()) as { token?: string; error?: string };
      if (!loginRes.ok || !loginBody.token) {
        throw new Error(loginBody.error || "Login automatico non riuscito");
      }

      const token = loginBody.token;
      localStorage.setItem("token", token);
      registeredTokenRef.current = token;
      clearYumeSession();
      setIsFinishing(true);
      setIsInputDisabled(true);

      playMessageSequence(
        [
          { text: `Ecco fatto. Ora ${data.nomePg} è pronto a venire al mondo.`, delay: 900 },
          { text: "Ti aspettiamo~ 🖤", delay: 1200 },
        ],
      );
    },
    [playMessageSequence],
  );

  const restartRegistration = useCallback(() => {
    clearAllTimers();
    clearYumeSession();
    const fresh = createFreshSession();
    sessionRef.current = fresh;
    setSession(fresh);
    setMessages([]);
    setInputValue("");
    setError("");
    setIsFinishing(false);
    setIsInputDisabled(true);
    setShowYesNo(false);
    setShowRecapButtons(false);
    playMessageSequence(OPENING, () => {
      const next = { ...createFreshSession(), step: 0 };
      saveYumeSession(next);
      setSession(next);
      sessionRef.current = next;
      setIsInputDisabled(false);
    });
  }, [clearAllTimers, playMessageSequence]);

  const goToLand = useCallback(() => {
    const token = registeredTokenRef.current ?? localStorage.getItem("token");
    if (token) onRegisterSuccess(token);
  }, [onRegisterSuccess]);

  const startNewRegistration = useCallback(() => {
    localStorage.removeItem("token");
    registeredTokenRef.current = null;
    restartRegistration();
  }, [restartRegistration]);

  const handleFinalSubmit = useCallback(async () => {
    const data = sessionRef.current.userData;
    if (!data.nomePg || !data.email || !data.password) {
      playMessageSequence(
        [
          {
            text: "Ugh. Qualcosa si è inceppato negli ingranaggi — non è colpa tua.\nRiprova pure: io mi ricordo tutto. 🖤",
            delay: 500,
          },
        ],
        () => setIsInputDisabled(false),
      );
      return;
    }

    setIsYumeTyping(true);
    setIsInputDisabled(true);
    setShowRecapButtons(false);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          characterName: data.nomePg,
          playerPreferences: data.playerPreferences.trim() || undefined,
        }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string; code?: string };

      if (res.status === 409 && body.code === "EMAIL_TAKEN") {
        persist({ step: 8, submitRetryCount: sessionRef.current.submitRetryCount + 1 });
        playMessageSequence(
          [
            {
              text: "Uhm. Qualcuno ha già lasciato questo contatto... o forse sei già dei nostri?\nSe è così, la porta giusta è il [@login]. Se invece l'email è sbagliata, correggiamola: qual è il tuo indirizzo [@email]?",
              delay: 600,
            },
          ],
          () => setIsInputDisabled(false),
        );
        return;
      }

      if (res.status === 409 && body.code === "CHARACTER_NAME_TAKEN") {
        persist({ step: 7, submitRetryCount: sessionRef.current.submitRetryCount + 1 });
        playMessageSequence(
          [
            {
              text: "Ops — qualcuno ti ha rubato il nome sul filo di lana. Capita, nei sogni affollati. Scegline un altro~",
              delay: 500,
            },
            {
              text: "Come si [@chiami]? Solo il nome, per favore — quello che comparirà sui documenti.",
              delay: 1200,
            },
          ],
          () => setIsInputDisabled(false),
        );
        return;
      }

      if (!res.ok) throw new Error(body.error || "Registrazione non riuscita");

      persist({ submitRetryCount: 0 });
      await autoLoginAndFinish(data);
    } catch (err) {
      const retries = sessionRef.current.submitRetryCount + 1;
      persist({ submitRetryCount: retries });
      const msg =
        retries >= 2
          ? "Okay, gli ingranaggi fanno i capricci sul serio. Concedimi qualche minuto e riprova — i tuoi dati restano al sicuro con me."
          : "Ugh. Qualcosa si è inceppato negli ingranaggi — non è colpa tua.\nRiprova pure: io mi ricordo tutto. 🖤";
      setError(err instanceof Error ? err.message : "Errore");
      playMessageSequence([{ text: msg, delay: 500 }], () => {
        setIsInputDisabled(false);
        setShowRecapButtons(true);
      });
    }
  }, [autoLoginAndFinish, persist, playMessageSequence]);

  const processInput = useCallback(
    async (rawInput: string) => {
      const userInput = rawInput.trim();
      const step = sessionRef.current.step;

      if (!userInput && step !== 6 && !isContinuationInput(userInput)) return;

      const displayUser = userInput || "...";
      addMessage(displayUser, "user", displayUser);
      setInputValue("");
      setIsInputDisabled(true);
      clearAllTimers();
      setShowYesNo(false);
      setShowRecapButtons(false);

      const data = sessionRef.current.userData;

      // STEP 5 — ok dopo Principia → Mugen + preferenze
      if (step === 5) {
        playMessageSequence(
          [
            {
              text: "Bene. Basta parlare della festa — parliamo di quello che c'è *fuori* dalla porta.",
              delay: 500,
            },
            {
              text: "Non dare di matto, o quelli della Mugen ti staranno addosso. Prendi un bel respiro, okay? Hai trenta giorni per scegliere cosa fare.",
              delay: 1800,
            },
            {
              text: "Non molestare nessuno, non parlare con gli ✨Holic✨ davanti ai civili, non fare nessuna cazzo di mossa strana nei paraggi di Edo.",
              delay: 2000,
            },
            {
              text: "Ah — e non ti chiederò mai chi sei o cosa sei. Qui contano altre cose.",
              delay: 1800,
            },
            {
              text: "Però... potrebbe interessarmi cos'hai *nella testa*. Quello sì!\nSei liber* di dirmi quello che vuoi — o assolutamente nulla. Tutto ciò che vorrai dirmi verrà usato per rendere la tua esperienza di gioco il più affine possibile alle tue aspettative. Se possibile!",
              delay: 2000,
            },
          ],
          () => {
            persist({ step: 6 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 0 — maggiorenne
      if (step === 0) {
        const yn = parseYesNo(userInput);
        if (yn === "yes") {
          finishYesNoStep(1, [
            {
              text: "Non per qualcosa. Ma qui possono uscire argomenti forti, e prevenire è meglio che spiegare dopo.",
              delay: 500,
            },
            {
              text: 'Hai letto l\'informativa [@privacy]? Se l\'hai letta, rispondi "sì" 🖤',
              delay: 1600,
            },
          ]);
          return;
        }
        if (yn === "no") {
          playMessageSequence(
            [
              {
                text: "Mi dispiace. Oyasumi è un mondo riservato ai maggiorenni: le porte, per te, per ora restano chiuse.\nNon è un addio — è un \"ci vediamo più avanti\". 🖤",
                delay: 600,
              },
            ],
            () => persist({ isTerminated: true }),
          );
          return;
        }
        handleYesNoAmbiguous('Ho l\'udito fino ma la pazienza corta. Solo "sì" o "no", tesoro.', () => {});
        return;
      }

      // STEP 1 — privacy
      if (step === 1) {
        const yn = parseYesNo(userInput);
        if (yn === "yes") {
          finishYesNoStep(2, [
            { text: "Perfetto. Scartoffie fatte, adesso viene il bello.", delay: 500 },
            { text: "Dimmi: hai già giocato ai giochi di ruolo via chat? (GDR PBC)", delay: 1400 },
          ]);
          return;
        }
        if (yn === "no") {
          const count = sessionRef.current.privacyNoCount + 1;
          persist({ privacyNoCount: count });
          const msg =
            count >= 2
              ? "Fai con calma~ io da qui non mi muovo."
              : 'Nessuna fretta. Il link è lì sopra: leggila e torna da me con un "sì".';
          playMessageSequence([{ text: msg, delay: 500 }], () => setIsInputDisabled(false));
          return;
        }
        handleYesNoAmbiguous('Rispondi "sì" solo dopo aver letto l\'informativa [@privacy].', () => {});
        return;
      }

      // STEP 2 — GDR
      if (step === 2) {
        const yn = parseYesNo(userInput);
        if (yn === "no") {
          persist({ branch: "novice" });
          playMessageSequence(
            [
              { text: "Non ti preoccupare, abbiamo pensato anche a te.", delay: 500 },
              {
                text: "Puoi leggere la [@guida] per scoprire come funziona e come muovere i primi passi.",
                delay: 1400,
              },
              {
                text: "E puoi esplorare l'[@ambientazione] per conoscere il mondo che abiterà il tuo personaggio.",
                delay: 1400,
              },
              { text: 'Quando sei pront*, scrivi "ok" o "..." per continuare.', delay: 1400 },
            ],
            () => {
              persist({ step: 3 });
              setIsInputDisabled(false);
            },
          );
          return;
        }
        if (yn === "yes") {
          persist({ branch: "veteran", step: 5 });
          playMessageSequence(
            [
              {
                text: "Oh, bene. Un vetereano — pardon, *veteran*. Allora mi risparmio la lezioncina e ti do solo quello che ti serve: le stranezze di casa nostra.",
                delay: 500,
              },
              {
                text: "Oyasumi non è reale, ma tu lo sei: il personaggio è un pupazzetto, il protagonista sei tu. E le regole della casa sono poche, ma non negoziabili.",
                delay: 1800,
              },
              {
                text: 'A tal proposito, prima che io e te iniziamo una rissa basata sulla fuffa... 💀 leggi i [@principia] ("Principia Satirica"), quando hai un attimo. Fidati: ti risparmia la rissa.\nQuando sei pront*, un "ok" e andiamo avanti.',
                delay: 2000,
              },
            ],
            () => setIsInputDisabled(false),
          );
          return;
        }
        handleYesNoAmbiguous('Dimmi solo "sì" o "no" — hai già giocato ai GDR via chat?', () => {});
        return;
      }

      // STEP 3 — novice ok
      if (step === 3) {
        if (!isContinuationInput(userInput)) {
          playMessageSequence(
            [{ text: 'Quando sei pront*, scrivi "ok" o "..." per continuare.', delay: 400 }],
            () => setIsInputDisabled(false),
          );
          return;
        }
        playMessageSequence(
          [
            {
              text: "Ho costruito questo mondo, mattone dopo mattone. L'ho costruito per me, perché volevo un posto sicuro.",
              delay: 500,
            },
            {
              text: "L'ho costruito per te, perché tu ti sentissi a casa. Chiunque tu sia, ovunque tu vada e da qualsiasi luogo tu venga.",
              delay: 1600,
            },
            {
              text: "Certo, Oyasumi non è reale. Il tuo personaggio è solo un pupazzetto; ma il vero protagonista sei tu. E sei tu a decidere quanto renderlo vivo — con la tua fantasia.",
              delay: 2000,
            },
            { text: "...", delay: 1200 },
            {
              text: "Dimmi una cosa. Ti è mai capitato di svegliarti con la sensazione di aver dimenticato un sogno importante?",
              delay: 1400,
            },
          ],
          () => {
            persist({ step: 4 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 4 — dream answer
      if (step === 4) {
        const affirmative = isAffirmativeDreamAnswer(userInput);
        const reaction = affirmative
          ? "Lo sapevo. Avete tutti quella faccia, voi che ricordate a metà.\nTienila stretta, quella sensazione. Qui dentro tornerà utile."
          : "Beati i sonni pesanti~ Ma non ti affezionare troppo: qui i sogni hanno la brutta abitudine di ricordarsi di te.";
        playMessageSequence(
          [
            { text: reaction, delay: 500 },
            {
              text: "Immagina Oyasumi come una festa. Io ho stampato gli inviti, e ho scritto delle regole perché tutti si sentano a proprio agio. Tu sei l'invitat*.",
              delay: 1600,
            },
            {
              text: "Divertiti con tutto ciò che ti offriamo e tutto quello che trovi da sol*, senza rovinare la festa agli altri invitati.",
              delay: 1800,
            },
            { text: "*coff* Bene, proseguiamo! 🎀", delay: 1200 },
            {
              text: "Qui la narrazione è la carta vincente. 💫 Del resto alla base del gioco di ruolo c'è il raccontare una storia, no?",
              delay: 1400,
            },
            {
              text: "E attenzione... 😒 Non sto parlando di essere scrittori da premio Nobel, ma di *voler* raccontare! Bene o male, in modo arzigogolato o semplice.",
              delay: 1800,
            },
            {
              text: "L'unica cosa non opinabile, credimi, è la matematica.",
              delay: 1400,
            },
            {
              text: 'A tal proposito, prima che io e te iniziamo una rissa basata sulla fuffa... 💀 leggi i [@principia] ("Principia Satirica"), quando hai un attimo. Fidati: ti risparmia la rissa.\nQuando sei pront*, un "ok" e andiamo avanti.',
              delay: 2000,
            },
          ],
          () => {
            persist({ step: 5 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 6 — preferenze
      if (step === 6) {
        const prefs = userInput;
        persist({ userData: { ...data, playerPreferences: prefs } });
        const tail =
          prefs.trim().length > 0
            ? "Mmh. Interessante. Me lo segno — e non chiedermi dove."
            : "Il tipo silenzioso, eh? Va bene anche così.";
        playMessageSequence(
          [
            { text: tail, delay: 500 },
            {
              text: "Ora parliamo di te. Anzi: del tuo personaggio.\nCome si [@chiami]? Solo il nome, per favore — quello che comparirà sui documenti.",
              delay: 1400,
            },
          ],
          () => {
            persist({ step: 7 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 7 — nome
      if (step === 7) {
        const v = validateCharacterName(userInput);
        if (v === "empty") {
          playMessageSequence(
            [{ text: "Il silenzio è affascinante, ma non si scrive sui documenti. Un nome, dai.", delay: 400 }],
            () => setIsInputDisabled(false),
          );
          return;
        }
        if (v === "invalid") {
          playMessageSequence(
            [
              {
                text: "Mmh, questo nome non entra nei moduli. Niente simboli strani, e una lunghezza umana, per favore.",
                delay: 400,
              },
            ],
            () => setIsInputDisabled(false),
          );
          return;
        }
        const available = await checkNameAvailable(userInput);
        if (!available) {
          playMessageSequence(
            [
              {
                text: "Ops. Qualcuno in Oyasumi porta già questo nome — e due omonimi alla stessa festa portano sfortuna. Scegline un altro~",
                delay: 400,
              },
            ],
            () => setIsInputDisabled(false),
          );
          return;
        }
        persist({ userData: { ...data, nomePg: userInput.trim() } });
        if (fixFieldRef.current === "name") {
          fixFieldRef.current = null;
          playMessageSequence(
            [
              {
                text: (d) =>
                  `Ultimo sguardo alle scartoffie prima del timbro:\n— Personaggio: ${d.nomePg}\n— Email: ${d.email}\nTutto giusto?`,
                delay: 500,
              },
            ],
            () => {
              persist({ step: 11 });
              setIsInputDisabled(false);
              setShowRecapButtons(true);
            },
          );
          return;
        }
        playMessageSequence(
          [
            {
              text: (d) =>
                `Beh, complimenti, ${d.nomePg}. Un pugno di lettere ti ha appena concesso l'apertura del terzo occhio. Ora sei un analista.`,
              delay: 500,
            },
            { text: "...oh, beh. Per lo meno, lo *sarai*.", delay: 1400 },
            {
              text: 'Per ora sei un "nemuribito", un sonnambulo. Li chiamano così quelli come te, quando la veglia è appena iniziata — e se per te è iniziata da un pezzo, sei stat* brav* a nasconderlo. Noi holic amiamo la vostra aria smarrita, eccessivamente coinvolta.',
              delay: 1800,
            },
            {
              text: "Comunque non demordere: l'ordine ti troverà. Lo fanno sempre. È per il tuo bene!",
              delay: 1600,
            },
            {
              text: "Ora le ultime scartoffie, promesso. Lasciami un contatto, così ci sentiamo presto: qual è il tuo indirizzo [@email]?",
              delay: 1400,
            },
          ],
          () => {
            persist({ step: 8 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 8 — email
      if (step === 8) {
        if (!validateEmail(userInput)) {
          playMessageSequence(
            [{ text: "Mmh... questo non profuma di email. Ricontrolla?", delay: 400 }],
            () => setIsInputDisabled(false),
          );
          return;
        }
        persist({ userData: { ...data, email: userInput.trim() } });
        if (fixFieldRef.current === "email") {
          fixFieldRef.current = null;
          playMessageSequence(
            [
              {
                text: (d) =>
                  `Ultimo sguardo alle scartoffie prima del timbro:\n— Personaggio: ${d.nomePg}\n— Email: ${d.email}\nTutto giusto?`,
                delay: 500,
              },
            ],
            () => {
              persist({ step: 11 });
              setIsInputDisabled(false);
              setShowRecapButtons(true);
            },
          );
          return;
        }
        playMessageSequence(
          [
            {
              text: "...ah, e una [@password]! 👽\nMinimo 8 caratteri. E non dirla a nessuno — nemmeno a me, che infatti non la vedrò.",
              delay: 500,
            },
          ],
          () => {
            persist({ step: 9 });
            setIsInputDisabled(false);
          },
        );
        return;
      }

      // STEP 9 — password
      if (step === 9) {
        if (userInput.length < 8) {
          playMessageSequence(
            [{ text: "Troppo corta. Almeno 8 caratteri — i segreti brevi durano poco, qui.", delay: 400 }],
            () => setIsInputDisabled(false),
          );
          return;
        }
        persist({ userData: { ...data, password: userInput } });
        playMessageSequence([{ text: "Riscrivila per [@conferma].", delay: 400 }], () => {
          persist({ step: 10 });
          setIsInputDisabled(false);
        });
        return;
      }

      // STEP 10 — conferma password
      if (step === 10) {
        if (userInput !== data.password) {
          persist({ userData: { ...data, password: "" }, step: 9 });
          playMessageSequence(
            [
              {
                text: "Non combaciano. Succede anche ai migliori~ Riproviamo dall'inizio: nuova [@password]!",
                delay: 500,
              },
            ],
            () => setIsInputDisabled(false),
          );
          return;
        }
        playMessageSequence(
          [
            {
              text: (d) =>
                `Ultimo sguardo alle scartoffie prima del timbro:\n— Personaggio: ${d.nomePg}\n— Email: ${d.email}\nTutto giusto?`,
              delay: 500,
            },
          ],
          () => {
            persist({ step: 11 });
            setIsInputDisabled(false);
            setShowRecapButtons(true);
          },
        );
        return;
      }

      // STEP 11 — recap
      if (step === 11) {
        const yn = parseYesNo(userInput);
        if (yn === "yes") {
          await handleFinalSubmit();
          return;
        }
        if (yn === "no") {
          playMessageSequence(
            [{ text: "Nessun problema. Cosa sistemiamo — il nome o l'email?", delay: 400 }],
            () => {
              persist({ step: 12 });
              setIsInputDisabled(false);
            },
          );
          return;
        }
        setShowRecapButtons(true);
        setIsInputDisabled(false);
        return;
      }

      // STEP 12 — correzione campo
      if (step === 12) {
        const lower = userInput.toLowerCase();
        if (lower.includes("nome") || lower.includes("personaggio") || lower.includes("pg")) {
          fixFieldRef.current = "name";
          playMessageSequence(
            [
              {
                text: "Va bene. Come si [@chiami]? Solo il nome, per favore — quello che comparirà sui documenti.",
                delay: 400,
              },
            ],
            () => {
              persist({ step: 7 });
              setIsInputDisabled(false);
            },
          );
          return;
        }
        if (lower.includes("email") || lower.includes("mail")) {
          fixFieldRef.current = "email";
          playMessageSequence(
            [{ text: "Qual è il tuo indirizzo [@email]?", delay: 400 }],
            () => {
              persist({ step: 8 });
              setIsInputDisabled(false);
            },
          );
          return;
        }
        playMessageSequence(
          [{ text: "Scrivi nome o email — così so cosa correggere.", delay: 400 }],
          () => setIsInputDisabled(false),
        );
      }
    },
    [
      addMessage,
      clearAllTimers,
      finishYesNoStep,
      handleFinalSubmit,
      handleYesNoAmbiguous,
      persist,
      playMessageSequence,
    ],
  );

  useEffect(() => {
    const stored = loadYumeSession();
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Sessione legacy bloccata: isComplete salvato ma redirect non completato
    if (stored?.isComplete) {
      clearYumeSession();
      if (savedToken) {
        onRegisterSuccess(savedToken);
        return;
      }
      playMessageSequence(OPENING, () => {
        persist({ step: 0 });
        setIsInputDisabled(false);
        setHydrated(true);
      });
      return () => clearAllTimers();
    }

    if (stored && stored.messages.length > 0) {
      setSession(stored);
      setMessages(
        stored.messages.map((m) => ({
          sender: m.sender,
          plain: m.text,
          content: m.sender === "yume" ? renderYume(m.text) : m.text,
        })),
      );
      setIsInputDisabled(stored.isTerminated || false);
      setShowRecapButtons(stored.step === 11 && !stored.isTerminated);
      setHydrated(true);
      return;
    }

    playMessageSequence(OPENING, () => {
      persist({ step: 0 });
      setIsInputDisabled(false);
      setHydrated(true);
    });
    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const frame = requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, isYumeTyping]);

  const handleUserReply = (e: React.FormEvent) => {
    e.preventDefault();
    void processInput(inputValue);
  };

  const sendYesNo = (answer: "yes" | "no") => {
    void processInput(answer === "yes" ? "sì" : "no");
  };

  const step = session.step;
  const inputType = step === 9 || step === 10 ? "password" : step === 8 ? "email" : "text";

  const flowLocked = isFinishing || session.isTerminated;

  const placeholder = (() => {
    if (session.isTerminated) return "Registrazione non possibile.";
    if (isFinishing) return "Registrazione completata!";
    if (isInputDisabled) return "Yume-chan sta scrivendo...";
    if (step === 6) return "Preferenze di gioco (opzionale)...";
    if (step === 11) return 'Scrivi "sì" o "no"...';
    return "Scrivi la tua risposta...";
  })();

  if (!hydrated) {
    return (
      <div className="chat-register-container chat-register-container--loading">
        <p className="text-gray-500 text-sm p-4">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="chat-register-container">
      <header className="chat-header">
        <div className="chat-header-contact">
          <img src="/yumechan/iconayumetalk.png" alt="" className="chat-header-avatar" />
          <div className="chat-header-meta">
            <h2>Yume-chan</h2>
            <p className="chat-header-status">
              {isYumeTyping
                ? "sta scrivendo…"
                : isFinishing
                  ? "iscrizione completata"
                  : "guida all'iscrizione"}
            </p>
          </div>
        </div>
      </header>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const showYumeAvatar = msg.sender === "yume" && prev?.sender !== "yume";
          return (
            <div
              key={`${index}-${msg.plain?.slice(0, 12) ?? index}`}
              className={`chat-message-row ${msg.sender}${showYumeAvatar ? " chat-message-row--group-start" : ""}`}
            >
              {msg.sender === "yume" && (
                <div className="chat-avatar-slot" aria-hidden>
                  {showYumeAvatar ? (
                    <img src="/yumechan/iconayumetalk.png" alt="" className="chat-avatar" />
                  ) : (
                    <span className="chat-avatar-spacer" />
                  )}
                </div>
              )}
              <div className={`message-bubble ${msg.sender}`}>
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        {isYumeTyping && (
          <div className="chat-message-row yume chat-message-row--group-start">
            <div className="chat-avatar-slot" aria-hidden>
              <img src="/yumechan/iconayumetalk.png" alt="" className="chat-avatar" />
            </div>
            <div className="message-bubble yume typing-indicator" aria-label="Yume-chan sta scrivendo">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
        {isFinishing && (
          <div className="chat-register-recovery">
            <p className="success-message">Iscrizione completata. Scegli cosa fare:</p>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        <div ref={chatEndRef} />
      </div>

      {(showYesNo || showRecapButtons) && !isInputDisabled && !session.isTerminated && !isFinishing && (
        <div className="chat-quick-replies">
          {showYesNo && (
            <>
              <button type="button" className="chat-quick-btn" onClick={() => sendYesNo("yes")}>
                Sì
              </button>
              <button type="button" className="chat-quick-btn" onClick={() => sendYesNo("no")}>
                No
              </button>
            </>
          )}
          {showRecapButtons && (
            <>
              <button type="button" className="chat-quick-btn chat-quick-btn--gold" onClick={() => sendYesNo("yes")}>
                Tutto giusto
              </button>
              <button type="button" className="chat-quick-btn" onClick={() => sendYesNo("no")}>
                Correggi
              </button>
            </>
          )}
        </div>
      )}

      <form className="chat-composer" onSubmit={handleUserReply}>
        {isFinishing ? (
          <div className="chat-finish-actions">
            <button type="button" className="chat-finish-btn chat-finish-btn--gold" onClick={goToLand}>
              Vai alla land
            </button>
            <button type="button" className="chat-finish-btn" onClick={startNewRegistration}>
              Nuova iscrizione
            </button>
          </div>
        ) : (
          <div className="chat-composer-field">
            <input
              type={inputType}
              className="chat-input"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isInputDisabled || flowLocked}
              aria-label="Risposta a Yume-chan"
              autoComplete={step === 9 || step === 10 ? "new-password" : step === 8 ? "email" : "off"}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={isInputDisabled || flowLocked}
              aria-label="Invia messaggio"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path fill="currentColor" d="M3.4 20.6 21 12 3.4 3.4l2.8 7.2L17 12l-10.8 1.4-2.8 7.2z" />
              </svg>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
