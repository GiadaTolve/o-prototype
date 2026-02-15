interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    isLoading?: boolean;
  }
  
  export function Button({ 
    children, 
    variant = 'primary', 
    isLoading, 
    className = '', 
    ...props 
  }: ButtonProps) {
    
    const baseStyle = "px-6 py-2 rounded transition-all duration-300 font-bold uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-[var(--accent-red)] text-white hover:bg-red-800 shadow-[0_0_15px_rgba(138,28,28,0.4)] hover:shadow-[0_0_25px_rgba(138,28,28,0.6)]",
      secondary: "border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)] hover:text-black",
      ghost: "text-gray-400 hover:text-white"
    };
  
    return (
      <button 
        className={`${baseStyle} ${variants[variant]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? "Caricamento..." : children}
      </button>
    );
  }