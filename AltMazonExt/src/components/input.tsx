import './input.css'

export interface InputProps {
  svgIcon?: React.ReactNode;
}

export default function Input({ className, svgIcon, ...props }: React.ComponentProps<"input"> & InputProps) {
  return (
    <label className="label">
      <span className="icon">
        {svgIcon}
      </span>
    <input
      {...props}
      data-slot="input"
      className={`input ${className}`}
    />
</label>
  );
}
