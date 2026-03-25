import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder, required = false, autoComplete, id, className = '' }) => {
  const inputId = id || name;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={inputId}>{label}</label>}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
      />
    </div>
  );
};

export default Input;
