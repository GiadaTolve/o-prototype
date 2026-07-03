"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type UserData = {
  nomePg: string;
  email: string;
  password: string;
  playerPreferences: string;
};

type FlowMessage = { text: string | ((data: UserData) => string); delay: number };

type StepConfig = {
  messages?: FlowMessage[];
  nextStep?: number;
  handleUserReply?: (
    input: string,
    ctx: {
      advance: (nextStep: number, messages: FlowMessage[]) => void;
      terminate: (message: string) => void;
      openGuida: () => void;
      openLore: () => void;
      userData: UserData;
    },
  ) => void;
  action?: (
    input: string,
    dataSetter: {
      setNomePg: (v: string) => void;
      setEmail: (v: string) => void;
      setPassword: (v: string) => void;
      setPlayerPreferences: (v: string) => void;
    },
    submit: () => void,
  ) => void;
  validator?: (input: string, data?: UserData) => boolean;
  errorMessage?: string;
};

const conversationFlow: Record<number, StepConfig> = {
  0: {
    messages: [
      {
        text: "Hey ✨ Se sei venuto qui, hai deciso d'intraprendere un percorso totalmente nuovo, facendo un passo al di fuori della realta' ! ",
        delay: 1000,
      },
      { text: "...", delay: 1500 },
      { text: "Beh, benvenuto!", delay: 1000 },
      { text: "Hai già giocato ai giochi di ruolo via chat? (GDR PBC)", delay: 1500 },
    ],
    nextStep: 1,
  },
  1: {
    handleUserReply: (input, { openGuida, openLore, advance }) => {
      if (input.toLowerCase().includes("no")) {
        advance(2, [
          { text: "Non ti preoccupare, abbiamo pensato anche a te.", delay: 500 },
          {
            text: "Puoi leggere la Guida per scoprire come funziona e come muovere i primi passi.",
            delay: 1500,
          },
          {
            text: "E puoi esplorare l'Ambientazione per conoscere il mondo che abiterà il tuo personaggio.",
            delay: 1500,
          },
          { text: "Quando sei pronto, scrivi 'ok' o '...' per continuare.", delay: 1500 },
        ]);
        void openGuida;
        void openLore;
      } else {
        advance(2, [
          { text: "Oh, bene. Allora io mi occupero' solo di darti una piccola premessa utile!", delay: 500 },
        ]);
      }
    },
  },
  2: {
    messages: [
      {
        text: "Ho costruito questo mondo, mattone dopo mattone. L'ho costruito per me, perche' volevo un posto sicuro.",
        delay: 1500,
      },
      {
        text: "L'ho costruito per te, poiche' ti sentissi a casa. Chiunque tu sia, ovunque tu vada e da qualsiasi luogo tu venga.",
        delay: 2000,
      },
      {
        text: "Certo, Oyasumi non e' reale. Il tuo personaggio e' solo un pupazzetto; ma il protagonista inconsapevole sei tu, e sei solo tu a renderti tale. Con la tua fantasia.",
        delay: 2500,
      },
      { text: "...", delay: 2000 },
    ],
    nextStep: 3,
  },
  3: {
    messages: [
      {
        text: "Immagina Oyasumi dopotutto come una festa. Io ho stampato gli inviti, e ho fatto delle regole poiche' tutti si sentano a proprio agio. Tu sei l'invitat*.",
        delay: 1500,
      },
      {
        text: "Divertiti con tutto ciò che ti offriamo e tutto quello che trovi da sol*, senza rovinare la festa a tutti gli invitati.",
        delay: 2500,
      },
      { text: "*coff* Bene, proseguiamo! 🎀", delay: 1500 },
      {
        text: "Qui la narrazione e' la carta vincente. 💫 Del resto alla base del gioco di ruolo c'e' il raccontare una storia, no?",
        delay: 1500,
      },
      {
        text: "E attenzione... 😒 Non sto parlando di esser scrittori da premi nobel, ma di voler raccontare! Bene o male, in modo arzigogolato o semplice. L'unica cosa non opinabile, amico mio, e' la matematica.",
        delay: 2500,
      },
      {
        text: 'A tal proposito, prima che io e te iniziamo una rissa basata sulla fuffa... 💀 Leggi "Principia Satirica". E poi torna a dirmi se hai capito, e che ne pensi!',
        delay: 3500,
      },
    ],
    nextStep: 4,
  },
  4: {
    messages: [
      {
        text: "Ah, ho parlato troppo. Ma almeno le basi sono chiare. Ora parliamo di te, del tuo personaggio! Come ti @chiami?",
        delay: 500,
      },
    ],
    action: (input, dataSetter) => dataSetter.setNomePg(input),
    validator: (input) => input.trim().length > 0,
    errorMessage: "Per favore, inserisci un nome per il tuo personaggio.",
    nextStep: 5,
  },
  5: {
    messages: [
      {
        text: (data) =>
          `Beh, complimenti ${data.nomePg}. Un pugno di lettere ti hanno appena concesso l'apertura del terzo occhio. Ora sei un'analista.`,
        delay: 1000,
      },
      { text: "...oh, beh, per lo meno, lo sarai.", delay: 2000 },
      {
        text: "Ora sei un “nemuribito”, un sonnambulo. Li chiamano così quelli come te. Deve esser iniziata da poco- e se non è così, sei stat* brav* a nasconderlo. Noi holic amiamo la vostra aria smarrita, eccessivamente emotivamente coinvolta.",
        delay: 1500,
      },
      {
        text: "Comunque non demordere, l'ordine ti troverà. Lo fanno sempre. E' per il tuo bene!",
        delay: 1500,
      },
      { text: "Senti, un paio di domande... Sei maggiorenne? Rispondi solo 'Si' o 'No' ", delay: 1500 },
    ],
    handleUserReply: (input, { advance, terminate }) => {
      if (input.toLowerCase().includes("si")) {
        advance(6, [
          { text: "Non per qualcosa. Ma non si sa mai quali argomenti forti possono uscire, sempre meglio prevenire.", delay: 500 },
          { text: 'Hai letto l\'informativa @privacy? Se l\'hai letta, rispondi "Si" 🖤', delay: 2000 },
        ]);
      } else if (input.toLowerCase().includes("no")) {
        terminate("Mi dispiace, Oyasumi e' un mondo riservato ai maggiorenni. Le porte per te, per ora, restano chiuse.");
      } else {
        advance(5, [{ text: "Non ho capito bene. Per favore, rispondi solo 'si' o 'no'.", delay: 500 }]);
      }
    },
  },
  6: {
    handleUserReply: (input, { advance, userData }) => {
      if (input.toLowerCase().includes("si")) {
        advance(7, [
          { text: `Allora ${userData.nomePg}, credo con le scartoffie siamo a posto.`, delay: 1000 },
          {
            text: "Non dare di matto, o quelli della Mugen ti staranno addosso. Prendi un bel respiro, okay? Hai trenta giorni per scegliere cosa fare.",
            delay: 2000,
          },
          {
            text: "Non molestare nessuno, non parlare con gli ✨Holic✨ davanti ai civili, non fare nessuna cazzo di mossa strana nei paraggi di Edo.",
            delay: 2000,
          },
          {
            text: "E no, non mi interessa sapere cos'hai fra le gambe. Credo a nessuno interessi qui.",
            delay: 2000,
          },
          { text: "Però… potrebbe interessarmi cos'hai nella testa… Quello sì!", delay: 2000 },
          {
            text: "Sei libero di dirmi quello che vuoi, o magari assolutamente nulla. Ma tutto ciò che vorrai dirmi sarà impiegato attivamente per render la tua esperienza di gioco più affine possibile alla tua aspettativa, se possibile!",
            delay: 1500,
          },
        ]);
      } else {
        advance(6, [
          { text: "Devi confermare di aver letto l'informativa per proseguire. Rispondi 'si' se l'hai fatto.", delay: 500 },
        ]);
      }
    },
  },
  7: {
    messages: [{ text: "Abbiamo finito! Lasciami un tuo contatto, così ci sentiamo presto!", delay: 500 }],
    action: (input, dataSetter) => dataSetter.setPlayerPreferences(input),
    nextStep: 8,
  },
  8: {
    messages: [{ text: "Qual è il tuo indirizzo @email?", delay: 500 }],
    action: (input, dataSetter) => dataSetter.setEmail(input),
    validator: (input) => /\S+@\S+\.\S+/.test(input),
    errorMessage: "Mmmh, questo non sembra un indirizzo email valido. Puoi ricontrollare?",
    nextStep: 9,
  },
  9: {
    messages: [{ text: "...ah, e una @password! 👽", delay: 500 }],
    action: (input, dataSetter) => dataSetter.setPassword(input),
    validator: (input) => input.length >= 8,
    errorMessage: "La password deve essere di almeno 8 caratteri.",
    nextStep: 10,
  },
  10: {
    messages: [{ text: "Riscrivila per @conferma.", delay: 500 }],
    validator: (input, data) => input === data?.password,
    errorMessage: "Le password non coincidono. Riprova.",
    action: (_input, _dataSetter, submit) => submit(),
  },
};

type ChatMessage = { content: React.ReactNode; sender: "yume" | "user" };

export function LandingRegisterForm({
  onRegisterSuccess,
  onOpenGuida,
  onOpenLore,
}: {
  onRegisterSuccess: () => void;
  onOpenGuida: () => void;
  onOpenLore: () => void;
}) {
  const [userData, setUserData] = useState<UserData>({
    nomePg: "",
    email: "",
    password: "",
    playerPreferences: "",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState(0);
  const [isYumeTyping, setIsYumeTyping] = useState(true);
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const userDataRef = useRef(userData);
  userDataRef.current = userData;

  const addMessage = useCallback((content: React.ReactNode, sender: "yume" | "user") => {
    setMessages((prev) => [...prev, { content, sender }]);
  }, []);

  const clearAllTimers = useCallback(() => {
    activeTimers.current.forEach((t) => clearTimeout(t));
    activeTimers.current = [];
  }, []);

  const playMessageSequence = useCallback(
    (messageList: FlowMessage[] = [], onComplete?: () => void) => {
      clearAllTimers();
      setIsYumeTyping(true);
      let totalDelay = 0;
      messageList.forEach(({ text, delay }) => {
        const timer = setTimeout(() => {
          const messageText = typeof text === "function" ? text(userDataRef.current) : text;
          addMessage(messageText, "yume");
        }, totalDelay + delay);
        activeTimers.current.push(timer);
        totalDelay += delay;
      });
      const finalTimer = setTimeout(() => {
        setIsYumeTyping(false);
        onComplete?.();
      }, totalDelay + 500);
      activeTimers.current.push(finalTimer);
    },
    [addMessage, clearAllTimers],
  );

  const handleFinalSubmit = useCallback(async () => {
    const data = userDataRef.current;
    if (!data.nomePg || !data.email || !data.password) {
      addMessage(
        "Oh no! Sembra che manchi qualche informazione fondamentale. Per favore, ricarica la pagina e riprova.",
        "yume",
      );
      setError("Dati obbligatori mancanti.");
      setIsInputDisabled(true);
      return;
    }
    setIsYumeTyping(true);
    setIsInputDisabled(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          characterName: data.nomePg,
          playerPreferences: data.playerPreferences || "Nessuna preferenza espressa.",
        }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error || "Registrazione non riuscita");

      playMessageSequence(
        [
          { text: `Ecco fatto. Ora ${data.nomePg} è pronto a venire al mondo.`, delay: 1000 },
          { text: "Ti aspettiamo~", delay: 1500 },
        ],
        () => {
          setIsComplete(true);
          setTimeout(() => onRegisterSuccess(), 3000);
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Qualcosa è andato storto";
      setError(msg);
      addMessage(`Oh no! C'è stato un problema: ${msg}. Ricarica la pagina per riprovare.`, "yume");
      setIsYumeTyping(false);
    }
  }, [addMessage, onRegisterSuccess, playMessageSequence]);

  useEffect(() => {
    playMessageSequence(conversationFlow[0].messages ?? [], () => {
      setIsInputDisabled(false);
      setStep(conversationFlow[0].nextStep ?? 1);
    });
    return () => clearAllTimers();
  }, [clearAllTimers, playMessageSequence]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isYumeTyping]);

  const handleUserReply = (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = inputValue.trim();
    const isContinuationInput = ["...", "ok", ""].includes(userInput.toLowerCase());

    if (!isContinuationInput && !userInput) return;

    addMessage(inputValue || "...", "user");
    setInputValue("");
    setIsInputDisabled(true);
    clearAllTimers();

    const currentStepConfig = conversationFlow[step];
    if (!currentStepConfig) return;

    if (currentStepConfig.handleUserReply) {
      const advance = (nextStep: number, msgs: FlowMessage[]) => {
        playMessageSequence(msgs, () => {
          setStep(nextStep);
          setIsInputDisabled(false);
        });
      };
      const terminate = (message: string) => {
        playMessageSequence([{ text: message, delay: 500 }], () => setIsTerminated(true));
      };
      currentStepConfig.handleUserReply(userInput, {
        advance,
        terminate,
        openGuida: onOpenGuida,
        openLore: onOpenLore,
        userData: userDataRef.current,
      });
      return;
    }

    if (currentStepConfig.validator && !currentStepConfig.validator(userInput, userDataRef.current)) {
      playMessageSequence([{ text: currentStepConfig.errorMessage ?? "Riprova.", delay: 500 }], () => {
        setIsInputDisabled(false);
      });
      return;
    }

    if (currentStepConfig.action) {
      const dataSetter = {
        setNomePg: (val: string) => setUserData((p) => ({ ...p, nomePg: val })),
        setEmail: (val: string) => setUserData((p) => ({ ...p, email: val })),
        setPassword: (val: string) => setUserData((p) => ({ ...p, password: val })),
        setPlayerPreferences: (val: string) => setUserData((p) => ({ ...p, playerPreferences: val })),
      };
      currentStepConfig.action(userInput, dataSetter, handleFinalSubmit);
    }

    const nextStep = currentStepConfig.nextStep;
    if (nextStep && conversationFlow[nextStep]) {
      const nextStepConfig = conversationFlow[nextStep];
      if (nextStepConfig.handleUserReply && !nextStepConfig.messages) {
        setStep(nextStep);
        setIsInputDisabled(false);
      } else {
        playMessageSequence(nextStepConfig.messages ?? [], () => {
          setStep(nextStep);
          setIsInputDisabled(false);
        });
      }
    }
  };

  const inputType = step === 9 || step === 10 ? "password" : step === 8 ? "email" : "text";

  const placeholder = (() => {
    if (isTerminated) return "Registrazione non possibile.";
    if (isComplete) return "Registrazione completata!";
    if (isInputDisabled) return "Yume-chan sta scrivendo...";
    return "Scrivi la tua risposta...";
  })();

  return (
    <div className="chat-register-container">
      <div className="chat-header">
        <h2>Parla con Yume-chan</h2>
        <img src="/yumechan/iconayumetalk.png" alt="Yume-chan" className="yume-icon" />
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender}`}>
            <p>{msg.content}</p>
          </div>
        ))}
        {isYumeTyping && (
          <div className="message-bubble yume typing-indicator">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
        {isComplete && <p className="success-message">Benvenuto in Oyasumi! Verrai reindirizzato a breve...</p>}
        {error && <p className="error-message">{error}</p>}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-area" onSubmit={handleUserReply}>
        <input
          type={inputType}
          className="chat-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isInputDisabled || isComplete || isTerminated}
        />
        <button type="submit" className="chat-send-button" disabled={isInputDisabled || isComplete || isTerminated}>
          Invia
        </button>
      </form>
    </div>
  );
}
