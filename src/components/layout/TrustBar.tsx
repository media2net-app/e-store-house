const trustPoints = [
  "Comanzi pana la 23:00, primesti maine",
  "Livrare gratuita de la 50 EUR",
  "Plata ulterioara disponibila",
];

export default function TrustBar() {
  return (
    <div className="bg-[#251136] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2 text-xs font-semibold sm:text-sm">
        {trustPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
    </div>
  );
}
