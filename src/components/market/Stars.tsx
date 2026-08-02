export function Stars({
  rating,
  reviews,
  size = "sm",
}: {
  rating: number;
  reviews?: number;
  size?: "sm" | "lg";
}) {
  const rounded = Math.round(rating);

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`flex items-center gap-0.5 ${size === "lg" ? "text-base" : "text-xs"}`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rounded ? "text-gold" : "text-muted-foreground/40"}>
            ★
          </span>
        ))}
      </span>
      <span className={`font-mono ${size === "lg" ? "text-sm" : "text-xs"} text-muted-foreground`}>
        {rating.toFixed(1)}
        {reviews !== undefined ? ` (${reviews})` : ""}
      </span>
      <span className="sr-only">
        Rated {rating.toFixed(1)} out of 5{reviews !== undefined ? ` from ${reviews} reviews` : ""}
      </span>
    </span>
  );
}
