import React, { FC } from "react";

export const WelcomeScreen: FC = () => (
  <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
    <h2 className="text-2xl font-bold">Start Chatting</h2>
    <p>Select a conversation from your history or start a new one.</p>
  </div>
);
