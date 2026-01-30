
import React from 'react';

const Logo: React.FC = () => (
  <a href="/" aria-label="Home" className="block">
    <img 
      src="/public/images/logo.svg" 
      alt="LegacyLink Modernizer" 
      width="32" 
      height="32"
      className="object-contain"
    />
  </a>
);

export default Logo;
