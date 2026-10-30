/** React escapes plain text; never interpret review content as HTML. */
export function ReviewText({
  text,
  excerpt = false,
}: {
  text: string;
  excerpt?: boolean;
}) {
  if (excerpt) return <p>{text.replace(/\n+/g, " ")}</p>;
  return (
    <div className="review-prose">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
    </div>
  );
}
