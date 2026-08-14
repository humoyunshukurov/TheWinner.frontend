import { useState } from 'react';
import { IconEye, IconEyeOff } from './icons';

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = 'new-password'
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input-wrap">
      <input
        className="form-input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Parolni yashirish' : "Parolni ko'rsatish"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
