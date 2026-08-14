// Purely local to the player who's about to be treated as absent - never
// rendered for their opponent, who's meanwhile just waiting normally with
// no idea this check is even happening. Backdrop click counts as "still
// here" too (same as this app's other confirm modals), not a silent
// dismiss - anything that proves someone's actually at the keyboard resets
// the miss streak.
export default function PresenceCheckModal({
  secondsLeft,
  onConfirm
}: {
  secondsLeft: number;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onConfirm}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <h3>Hali shu yerdamisiz?</h3>
        <p className="muted">
          Ketma-ket 2 ta savolga javob bermadingiz. {secondsLeft} soniya ichida javob bermasangiz, raqibingiz
          g&apos;olib deb topiladi.
        </p>
        <div className="modal-actions">
          <button className="pill-btn primary" onClick={onConfirm}>
            Ha, o&apos;yindaman!
          </button>
        </div>
      </div>
    </div>
  );
}
