const STEPS = ['Submitted', 'Under Scrutiny', 'Selected'];

export default function ProgressTracker({ currentStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0 w-full max-w-md">
      {STEPS.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 flex items-center justify-center text-xs font-bold border-2 ${
                  isCompleted
                    ? 'bg-navy-800 border-navy-800 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? '\u2713' : i + 1}
              </div>
              <span className={`mt-1 text-[10px] leading-tight text-center ${
                isCompleted ? 'text-navy-800 font-medium' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  i < currentIndex ? 'bg-navy-800' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
