interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
  }
  
  export function Input({ label, className = '', ...props }: InputProps) {
    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label className="text-xs uppercase tracking-widest text-gray-500 font-bold ml-1">
            {label}
          </label>
        )}
        <input 
          className={`
            w-full bg-[var(--panel-bg)] border border-[var(--border-color)] 
            text-gray-200 px-4 py-3 rounded 
            focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red)]
            placeholder-gray-700 transition-all duration-300
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }