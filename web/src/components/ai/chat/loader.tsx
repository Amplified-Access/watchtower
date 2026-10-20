const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={`flex gap-1 ${className}`}>
      <div
        className="w-1.25 h-1.25 apect-square bg-black rounded-full animate-bounce-custom shrink-0"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-1.25 h-1.25 apect-square bg-black rounded-full animate-bounce-custom shrink-0"
        style={{ animationDelay: "100ms" }}
      ></div>
      <div
        className="w-1.25 h-1.25 apect-square bg-black rounded-full animate-bounce-custom shrink-0"
        style={{ animationDelay: "300ms" }}
      ></div>
      <style jsx>{`
        @keyframes bounce-custom {
          100% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-custom {
          animation: bounce-custom 1s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default Loader;
