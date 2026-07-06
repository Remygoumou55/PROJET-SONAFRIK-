"use client";

interface WizardPublishedSuccessProps {
  title: string;
  onComplete: () => void;
}

export function WizardPublishedSuccess({ title, onComplete }: WizardPublishedSuccessProps) {
  return (
    <div className="pub-wiz pub-wiz--success">
      <div className="pub-wiz__success-inner">
        <div className="pub-wiz__success-icon" aria-hidden="true">🎉</div>
        <h2 className="pub-wiz__success-title">{title} est en route !</h2>
        <p className="pub-wiz__success-sub">
          Ton morceau est en cours de vérification. Tu seras notifié dès qu&apos;il sera en ligne.
        </p>
        <button type="button" className="pub-wiz__publish-btn" onClick={onComplete}>
          Retour à mes morceaux
        </button>
      </div>
    </div>
  );
}
