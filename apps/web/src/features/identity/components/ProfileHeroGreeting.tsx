"use client";

import { useEffect, useState } from "react";
import {
  getProfileGreetingParts,
  getProfileInspirationMessage,
} from "../lib/profileGreeting";

interface ProfileHeroGreetingProps {
  firstName: string;
}

export function ProfileHeroGreeting({ firstName }: ProfileHeroGreetingProps) {
  const [parts, setParts] = useState(() => getProfileGreetingParts(new Date().getHours()));
  const [inspiration, setInspiration] = useState(() => getProfileInspirationMessage());

  useEffect(() => {
    const refresh = () => {
      setParts(getProfileGreetingParts(new Date().getHours()));
      setInspiration(getProfileInspirationMessage());
    };

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="identity-profile-passport__intro">
      <p className="identity-profile-passport__salutation">
        {parts.greeting} {firstName}{" "}
        <span aria-hidden="true">{parts.emoji}</span>
      </p>
      <p className="identity-profile-passport__inspiration">{inspiration}</p>
    </div>
  );
}
