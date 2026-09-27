"use client";

import { Check, ListOrdered, X } from "lucide-react";
import {
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  assembledSentence,
  starPieceIndex,
  type SentenceBuildItem,
} from "@/lib/sentence-build";

type Phase = "idle" | "active" | "summary";

export function SentenceBuildSession({ items }: { items: SentenceBuildItem[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [index, setIndex] = useState(0);
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [drag, setDrag] = useState<{
    piece: number;
    x: number;
    y: number;
    over: number | null;
  } | null>(null);
  const [hotSlot, setHotSlot] = useState<number | null>(null);
  const gesture = useRef<{
    piece: number;
    originX: number;
    originY: number;
    moved: boolean;
    fromSlot: number | null;
  } | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const current = items[index];

  useEffect(() => {
    if (phase !== "active") return;
    if (checked) {
      nextButtonRef.current?.focus();
      return;
    }
    firstChoiceRef.current?.focus();
  }, [phase, index, checked]);

  if (items.length === 0) {
    return (
      <div role="status" className="px-4 py-16 text-center">
        <ListOrdered className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-medium text-ink">No sentences yet</h2>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sentence build</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Four pieces make one sentence. Drag them into the blanks to read it.
            Only the star is checked.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-6">
          <ul className="space-y-2 text-sm text-ink">
            <li>{`${items.length} questions, in book order`}</li>
            <li>Drag words into the blanks. Only the star is checked</li>
            <li>A note appears after you check, when the key has one</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setPhase("active");
              setIndex(0);
              setSlots([]);
              setDrag(null);
              setChecked(false);
              setResults([]);
            }}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const passed = results.filter(Boolean).length;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Set complete</h1>
          <p className="mt-2 text-sm text-muted">
            {passed} of {items.length} correct
          </p>
        </div>
        <ul className="space-y-2">
          {items.map((item, itemIndex) => {
            const isCorrect = results[itemIndex];
            return (
              <li
                key={item.id}
                className="rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p lang="ja" className="text-sm leading-relaxed text-ink">
                      {assembledSentence(item)}
                    </p>
                    {item.explanation ? (
                      <p lang="ja" className="mt-1 text-sm text-muted">
                        {item.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            setPhase("active");
            setIndex(0);
            setSlots([]);
            setDrag(null);
            setChecked(false);
            setResults([]);
          }}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start again
        </button>
      </div>
    );
  }

  if (!current) return null;

  const answerIndex = starPieceIndex(current);
  const placements =
    slots.length === current.pieces.length
      ? slots
      : current.pieces.map(() => null);
  const starChoice = placements[current.star];
  const correct = starChoice === answerIndex;
  const isLast = index + 1 >= items.length;

  function freshSlots(prev: (number | null)[]): (number | null)[] {
    return prev.length === current.pieces.length
      ? [...prev]
      : current.pieces.map(() => null);
  }

  function slotUnder(x: number, y: number): number | null {
    for (const node of document.elementsFromPoint(x, y)) {
      if (!(node instanceof HTMLElement)) continue;
      const raw = node.dataset.slot;
      if (raw === undefined) continue;
      const slot = Number(raw);
      if (Number.isInteger(slot)) return slot;
    }
    return null;
  }

  function placePiece(piece: number, slot: number) {
    setSlots((prev) => {
      const next = freshSlots(prev);
      const from = next.indexOf(piece);
      if (from === slot) return next;
      const displaced = next[slot];
      if (from !== -1) next[from] = displaced;
      next[slot] = piece;
      return next;
    });
  }

  function clearPiece(slot: number) {
    setSlots((prev) => {
      const next = freshSlots(prev);
      next[slot] = null;
      return next;
    });
  }

  function dropProps(slot: number) {
    return {
      onDragEnter: (event: ReactDragEvent<HTMLButtonElement>) => {
        if (checked) return;
        event.preventDefault();
        setHotSlot(slot);
      },
      onDragLeave: () => {
        setHotSlot((value) => (value === slot ? null : value));
      },
      onDragOver: (event: ReactDragEvent<HTMLButtonElement>) => {
        if (checked) return;
        event.preventDefault();
      },
      onDrop: (event: ReactDragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const piece = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isInteger(piece) || piece < 0 || piece >= current.pieces.length) return;
        placePiece(piece, slot);
        setHotSlot(null);
      },
    };
  }

  function dragProps(piece: number, fromSlot: number | null) {
    return {
      draggable: !checked,
      onDragStart: (event: ReactDragEvent<HTMLButtonElement>) => {
        if (checked) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", String(piece));
        event.dataTransfer.effectAllowed = "move";
        gesture.current = null;
        setDrag(null);
      },
      onDragEnd: (event: ReactDragEvent<HTMLButtonElement>) => {
        const pointerOwnsDrop = gesture.current?.moved === true && gesture.current.piece === piece;
        if (
          !pointerOwnsDrop &&
          fromSlot !== null &&
          event.dataTransfer.dropEffect === "none"
        ) {
          setSlots((prev) => {
            const next = freshSlots(prev);
            if (next[fromSlot] !== piece) return next;
            next[fromSlot] = null;
            return next;
          });
        }
        setHotSlot(null);
        setDrag(null);
      },
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (checked || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        gesture.current = {
          piece,
          originX: event.clientX,
          originY: event.clientY,
          moved: false,
          fromSlot,
        };
      },
      onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const session = gesture.current;
        if (!session || session.piece !== piece || session.fromSlot !== fromSlot) return;
        const distance = Math.hypot(
          event.clientX - session.originX,
          event.clientY - session.originY,
        );
        if (!session.moved && distance < 6) return;
        session.moved = true;
        setDrag({
          piece,
          x: event.clientX,
          y: event.clientY,
          over: slotUnder(event.clientX, event.clientY),
        });
      },
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const session = gesture.current;
        if (!session || session.piece !== piece || session.fromSlot !== fromSlot) return;
        gesture.current = null;
        if (session.moved) {
          const over = slotUnder(event.clientX, event.clientY);
          if (over === null) {
            if (session.fromSlot !== null) clearPiece(session.fromSlot);
          } else {
            placePiece(session.piece, over);
          }
        }
        setDrag(null);
      },
      onPointerCancel: () => {
        if (gesture.current?.piece !== piece || gesture.current.fromSlot !== fromSlot) return;
        gesture.current = null;
        setDrag(null);
      },
    };
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Sentence build</h1>
        <p className="mt-0.5 text-sm text-muted">
          {index + 1} / {items.length}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-6">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          Choose the piece in ★
        </p>
        <p lang="ja" className="mt-4 text-lg leading-loose text-ink">
          {current.before}
          <span className="mx-1 inline-flex flex-wrap items-center gap-1 align-middle">
            {placements.map((pieceIndex, slot) => {
              const isStar = slot === current.star;
              const shown =
                pieceIndex === null ? (isStar ? "★" : "") : current.pieces[pieceIndex];
              const starTone =
                checked && isStar
                  ? correct
                    ? "border-ok bg-ok/10 text-ok"
                    : "border-accent bg-accent/10 text-accent"
                  : isStar
                    ? "border-accent bg-accent/10 font-medium text-accent"
                    : "border-dashed border-line text-ink";
              return (
                <button
                  key={`${current.id}-${slot}`}
                  type="button"
                  lang="ja"
                  data-slot={slot}
                  disabled={checked}
                  aria-label={
                    isStar
                      ? shown && shown !== "★"
                        ? `Star blank, ${shown}. Only this blank is checked.`
                        : "Star blank. Only this blank is checked."
                      : shown
                        ? `Blank ${slot + 1}, ${shown}`
                        : `Blank ${slot + 1}`
                  }
                  {...dropProps(slot)}
                  {...(pieceIndex === null ? {} : dragProps(pieceIndex, slot))}
                  className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border px-1.5 text-center text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${
                    pieceIndex === null ? "" : "cursor-grab touch-none select-none"
                  } ${starTone} ${
                    drag?.over === slot || hotSlot === slot ? "ring-2 ring-accent/40" : ""
                  } ${drag?.piece === pieceIndex ? "opacity-40" : ""}`}
                >
                  {shown || "\u00a0"}
                </button>
              );
            })}
          </span>
          {current.after}
        </p>
        {checked ? null : (
          <p className="mt-3 text-sm text-muted">
            Drag a word into a blank. Only ★ is checked.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {current.pieces.map((piece, choiceIndex) => {
          const isPlaced = placements.includes(choiceIndex);
          const isCorrectChoice = choiceIndex === answerIndex;
          const stateClass = checked
            ? isCorrectChoice
              ? "border-ok bg-ok/10"
              : starChoice === choiceIndex
                ? "border-accent bg-accent/5"
                : "border-line bg-surface"
            : isPlaced
              ? "border-line bg-surface opacity-50"
              : "border-line bg-surface";

          return (
            <button
              key={`${current.id}-${piece}`}
              ref={choiceIndex === 0 ? firstChoiceRef : undefined}
              type="button"
              disabled={checked}
              {...dragProps(choiceIndex, null)}
              className={`flex min-h-12 cursor-grab touch-none items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-100 ${stateClass} ${
                drag?.piece === choiceIndex ? "opacity-40" : ""
              }`}
            >
              <span className="w-4 text-sm text-muted">{choiceIndex + 1}.</span>
              <span lang="ja" className="flex-1 text-base text-ink">
                {piece}
              </span>
              {checked && isCorrectChoice ? (
                <Check className="size-4 text-ok" aria-hidden="true" />
              ) : null}
              {checked && starChoice === choiceIndex && !isCorrectChoice ? (
                <X className="size-4 text-accent" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {checked ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              correct ? "border-ok/30 bg-ok/10" : "border-line bg-surface"
            }`}
          >
            <p className={`font-medium ${correct ? "text-ok" : "text-ink"}`}>
              {correct
                ? "Correct."
                : `Not quite. The star is ${current.pieces[answerIndex]}.`}
            </p>
            <p lang="ja" className="mt-2 leading-relaxed text-ink">
              {assembledSentence(current)}
            </p>
            {current.explanation ? (
              <p lang="ja" className="mt-2 leading-relaxed text-ink">
                {current.explanation}
              </p>
            ) : null}
            <p className="mt-1 text-muted">{current.meaning}</p>
          </div>
        ) : null}
      </div>

      <button
        ref={nextButtonRef}
        type="button"
        disabled={!checked && starChoice === null}
        onClick={() => {
          if (!checked) {
            setResults((prev) => [...prev, starChoice === answerIndex]);
            setDrag(null);
            setChecked(true);
            return;
          }
          if (isLast) {
            setPhase("summary");
            return;
          }
          setIndex((value) => value + 1);
          setSlots([]);
          setDrag(null);
          setChecked(false);
        }}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
      >
        {checked ? (isLast ? "See results" : "Next question") : "Check"}
      </button>
      {drag ? (
        <div
          aria-hidden="true"
          lang="ja"
          className="pointer-events-none fixed z-30 rounded-lg border border-accent bg-surface px-3 py-2 text-base text-ink shadow-lg"
          style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -120%)" }}
        >
          {current.pieces[drag.piece]}
        </div>
      ) : null}
    </div>
  );
}
