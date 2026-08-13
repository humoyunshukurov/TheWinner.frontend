// Shared by every question-answering screen (Testlar, 1vs1, Turnir, Kod,
// Marafon) so a question's image and text render identically everywhere.
// A code question is written with real embedded newlines (see the admin
// panel's AI-import prompt and manual question textarea) - detecting that
// and switching to a monospace/pre-wrapped style is what actually fixes
// code showing up unreadable, squished onto one line.
export default function QuestionPrompt({
  number,
  text,
  image
}: {
  number?: number;
  text: string;
  image?: string | null;
}) {
  const isCode = typeof text === 'string' && text.includes('\n');

  return (
    <>
      {image && (
        <div className="question-image-wrap">
          <img src={image} alt="" className="question-image" />
        </div>
      )}
      <p className={`question-text ${isCode ? 'code' : ''}`}>
        {number != null ? `${number}. ` : ''}
        {text}
      </p>
    </>
  );
}
