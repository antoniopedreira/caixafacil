import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-blue-600' 
          : 'bg-gradient-to-br from-purple-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-slate-200 text-slate-900'
        }`}>
          {isUser ? (
            <p className="text-sm">{message}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-slate prose-p:my-2 prose-ul:my-2 prose-li:my-0">
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}