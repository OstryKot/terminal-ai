import { useState, useEffect } from 'react';

const RetroTerminalGpt = ({ openAiKey }) => {
  const COMMANDS = {
    "hello": "How can I help you?",
    "help": "Available commands:\n- hello\n- help\n- clear\n- time\n- date\n- status\n- ask [question]\n- config api_key [your_key]\nType 'add_command [command] [response]' to add new command",
    "clear": "__CLEAR__",
    "time": () => `Current time: ${new Date().toLocaleTimeString()}`,
    "date": () => `Current date: ${new Date().toLocaleDateString()}`,
    "status": "All systems operational",
  };

  const [messages, setMessages] = useState([
    { text: 'System initialized...', sender: 'system', timestamp: new Date().toLocaleTimeString() },
    { text: 'Welcome to zTerm', sender: 'system', timestamp: new Date().toLocaleTimeString() },
    { text: 'Type "help" for available commands', sender: 'system', timestamp: new Date().toLocaleTimeString() },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const [commandList, setCommandList] = useState(COMMANDS);
  const [apiKey, setApiKey] = useState(openAiKey || '');
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
    const triggerGlitch = () => {
      const randomDelay = Math.random() * (8000 - 3000) + 3000;
      setTimeout(() => {
        setIsGlitching(true);
        setTimeout(() => {
          setIsGlitching(false);
          triggerGlitch();
        }, 200);
      }, randomDelay);
    };

    triggerGlitch();
    return () => setIsGlitching(false);
  }, []);

  const askGPT = async (question) => {
    if (!apiKey) {
      return "Error: OpenAI API key not configured. Use 'config api_key [your_key]' to set it.";
    }

    try {
      setIsLoading(true);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: question }],
          max_tokens: 500
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API error');
      }

      return data.choices[0].message.content;
    } catch (error) {
      return `Error: ${error.message}`;
    } finally {
      setIsLoading(false);
    }
  };

  const processCommand = async (input) => {
    const args = input.split(' ');
    const command = args[0].toLowerCase();

    
    if (command === 'config' && args[1] === 'api_key' && args[2]) {
      setApiKey(args[2]);
      return 'API key configured successfully';
    }

    
    if (command === 'ask' && args.length > 1) {
      const question = args.slice(1).join(' ');
      return await askGPT(question);
    }

    
    if (command === 'add_command' && args.length >= 3) {
      const newCommand = args[1].toLowerCase();
      const response = args.slice(2).join(' ');
      setCommandList(prev => ({
        ...prev,
        [newCommand]: response
      }));
      return `Command '${newCommand}' added successfully`;
    }

    
    if (command in commandList) {
      const response = commandList[command];
      if (response === '__CLEAR__') {
        setMessages([]);
        return null;
      }
      return typeof response === 'function' ? response() : response;
    }

    return `Command not found: ${command}. Type "help" for available commands.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const newMessage = {
        text: inputValue,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      
      
      if (inputValue.toLowerCase().startsWith('ask ')) {
        setMessages(prev => [...prev, {
          text: 'Processing request...',
          sender: 'system',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

      
      const response = await processCommand(inputValue.trim());
      if (response) {
        setMessages(prev => {
          
          const filteredMessages = inputValue.toLowerCase().startsWith('ask ')
            ? prev.filter(msg => msg.text !== 'Processing request...')
            : prev;

          return [...filteredMessages, {
            text: response,
            sender: 'system',
            timestamp: new Date().toLocaleTimeString()
          }];
        });
      }
    }
  };

  
  return (
    <div className="relative flex flex-col h-[768px] w-[1024px] bg-black border-2 border-green-500 font-mono p-4 rounded overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0_50%)_50%,rgba(0,0,0,0.25)_50%)] z-10" />
            
      <div className="absolute inset-0 mix-blend-screen opacity-50">
        {isGlitching && (
          <>
            <div className="absolute inset-0 text-red-500 animate-rgb-split-r">
              <div className="w-full h-full mix-blend-screen" />
            </div>
            <div className="absolute inset-0 text-green-500 animate-rgb-split-g">
              <div className="w-full h-full mix-blend-screen" />
            </div>
            <div className="absolute inset-0 text-blue-500 animate-rgb-split-b">
              <div className="w-full h-full mix-blend-screen" />
            </div>
          </>
        )}
      </div>

      
      <div className={`relative z-20 flex flex-col h-full text-justify   ${isGlitching ? 'animate-content-glitch' : ''}`}>
      
        <div className="border-b border-green-500 pb-2 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-500 animate-pulse glow-text">System initialized... Welcome to zTerm</span>
            <span className="text-xs text-green-500 glow-text">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

      
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-8">
          {messages.map((message, index) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-start space-x-2">
                <span className="text-green-300 text-xs glow-text">[{message.timestamp}]</span>
                <span className={`${message.sender === 'system' ? 'text-green-500' : 'text-green-400'} glow-text whitespace-pre-line`}>
                  {message.sender === 'system' ? '>' : '$'} {message.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        
        <form onSubmit={handleSubmit} className="flex items-center border-t border-green-500 pt-2">
          <span className="text-green-400 mr-2 glow-text">$</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-transparent text-green-500 focus:outline-none glow-text"
            placeholder="Type your command..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>

        {isLoading && (
        <div className="absolute bottom-16 right-4 text-green-500 animate-pulse glow-text">
          Processing...
        </div>
      )}

      </div>
      
            
      
      <style jsx>{`
        @keyframes rgbSplitR {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(3px, -3px); }
          50% { transform: translate(-2px, 2px); }
          75% { transform: translate(4px, -4px); }
        }

        @keyframes rgbSplitG {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-3px, 2px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-2px, 3px); }
        }

        @keyframes rgbSplitB {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(2px, 3px); }
          50% { transform: translate(-3px, -2px); }
          75% { transform: translate(1px, 4px); }
        }

        @keyframes contentGlitch {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(2px, -1px) skewX(3deg); }
          50% { transform: translate(-2px, 1px) skewX(-3deg); }
          75% { transform: translate(1px, -2px) skewX(2deg); }
        }

        .animate-rgb-split-r {
          animation: rgbSplitR 0.2s infinite linear;
        }

        .animate-rgb-split-g {
          animation: rgbSplitG 0.2s infinite linear;
        }

        .animate-rgb-split-b {
          animation: rgbSplitB 0.2s infinite linear;
        }

        .animate-content-glitch {
          animation: contentGlitch 0.2s infinite linear;
        }

        .glow-text {
          text-shadow: 
            0 0 2px #4ade80,
            0 0 4px #4ade80,
            0 0 6px #4ade80;
        }

        input::placeholder {
          color: #48BB78;
          opacity: 0.5;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #000;
          border: 1px solid #4ade80;
        }

        ::-webkit-scrollbar-thumb {
          background: #4ade80;
          box-shadow: 0 0 4px #4ade80;
        }

        input {
          caret-color: #4ade80;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { caret-color: transparent; }
        }
      `}</style>
    </div>
  );
};

export default RetroTerminalGpt;