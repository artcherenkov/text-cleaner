import { useState, useEffect, useRef, useCallback } from 'react';
import { LuClipboardCopy, LuClipboardCheck, LuInfo, LuX } from 'react-icons/lu'; // Иконки
import toast, { Toaster } from 'react-hot-toast'; // Импортируем toast

// Регулярное выражение для поиска невидимых символов и пробельных символов для замены
const REPLACE_REGEX = /[\u2028\u2029\p{Cf}\s]+/gu;

// Регулярное выражение для подсветки нежелательных символов
const HIGHLIGHT_INVISIBLE_REGEX = /[\u2028\u2029\p{Cf}]+/gu;
// Регулярное выражение для подсветки двойных пробелов
const HIGHLIGHT_DOUBLE_SPACE_REGEX = / {2,}/g;

// Функция для получения правильного склонения слова "символ"
function getPluralInvisibleSymbol(count: number): string {
  const num = Math.abs(count) % 100;
  const lastDigit = num % 10;

  if (num > 10 && num < 20) {
    return 'невидимых символов';
  }
  if (lastDigit === 1) {
    return 'невидимый символ';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'невидимых символа';
  }
  return 'невидимых символов';
}

function App() {
  const [inputText, setInputText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [inputCharCount, setInputCharCount] = useState(0);
  const [cleanedCharCount, setCleanedCharCount] = useState(0);
  const [invisibleCharCount, setInvisibleCharCount] = useState(0);
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [isInputCopied, setIsInputCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // --- Подсветка ---
  const generateHighlightedHtml = useCallback((text: string): string => {
    let count = 0;
    const highlighted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(HIGHLIGHT_INVISIBLE_REGEX, (match) => {
        count += match.length;
        return `<span class="outline outline-1 outline-orange-400 bg-orange-100/50 rounded-sm box-decoration-clone [outline-offset:-1px]">${match}</span>`;
      })
      .replace(HIGHLIGHT_DOUBLE_SPACE_REGEX, (match) => {
        return `<span class="outline outline-1 outline-yellow-400 bg-yellow-100/50 rounded-sm px-0.5 mx-px box-decoration-clone">${match}</span>`;
      })
      .replace(/\n/g, '<br />');

    setInvisibleCharCount(count);
    return highlighted;
  }, []);

  useEffect(() => {
    setHighlightedHtml(generateHighlightedHtml(inputText));
    setInputCharCount(inputText.length);
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [inputText, generateHighlightedHtml]);

  // --- Очистка ---
  const handleCleanText = () => {
    const cleaned = inputText
        .replace(REPLACE_REGEX, ' ')
        .trim();

    setCleanedText(cleaned);
    setCleanedCharCount(cleaned.length);
    const actuallyRemovedInvisible = (inputText.match(HIGHLIGHT_INVISIBLE_REGEX) || []).length;

    // Сразу копируем результат
    handleCopyToClipboard(cleaned, 'output');

    // Показываем тост
    if (actuallyRemovedInvisible > 0) {
      const num = Math.abs(actuallyRemovedInvisible) % 100;
      const lastDigit = num % 10;
      const verb = (lastDigit === 1 && num !== 11) ? 'Удален' : 'Удалено';
      const pluralForm = getPluralInvisibleSymbol(actuallyRemovedInvisible);

      toast.success(`${verb} ${actuallyRemovedInvisible} ${pluralForm}. Текст скопирован!`, {
        duration: 3000,
      });
    } else {
      toast.success('Невидимые символы не найдены. Текст скопирован!', {
        duration: 3000,
      });
    }
  };

  // --- Копирование ---
  const handleCopyToClipboard = (textToCopy: string, type: 'input' | 'output') => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        if (type === 'input') {
          setIsInputCopied(true);
          setTimeout(() => setIsInputCopied(false), 2000);
        } else {
          // Показываем тост только для ручного копирования результата, т.к. при очистке свой тост
          // Можно добавить toast.success('Скопировано!') и здесь, если нужно
        }
      })
      .catch(err => {
        console.error('Ошибка копирования: ', err);
      });
  };

  // --- Синхронизация скролла ---
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      if (highlightRef.current) {
          highlightRef.current.scrollTop = e.target.scrollTop;
      }
  };
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
        highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <span className="text-blue-600 font-mono text-xl">&lt;/&gt;</span>
             <h1 className="text-xl font-semibold text-gray-800">Unicode Cleaner</h1>
           </div>
           <p className="text-sm text-gray-500 hidden sm:block">
             Удаление невидимых символов из текста
           </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Info Box */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-start space-x-3 shadow-sm">
          <LuInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-medium text-gray-900">Об этом инструменте</h2>
            <p className="text-sm text-gray-700 mt-1">
              Находит и удаляет невидимые символы Unicode (U+2028, U+2029 и др.), которые могут вызывать проблемы в тексте.
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="mb-6">
          <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-2">
            Вставьте ваш текст ниже
          </label>
          <div className="relative bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
             {/* Highlighting Div */}
            <div
              ref={highlightRef}
              aria-hidden="true"
              className="absolute inset-0 w-full h-48 p-3 border border-transparent text-transparent whitespace-pre-wrap overflow-y-scroll pointer-events-none font-mono text-base leading-relaxed z-0 select-none"
              dangerouslySetInnerHTML={{ __html: highlightedHtml + '&nbsp;' }}
            />
            {/* Real Textarea */}
            <textarea
              ref={textareaRef}
              id="input-text"
              value={inputText}
              onChange={handleInputChange}
              onScroll={handleScroll}
              placeholder="Вставьте ваш текст сюда..."
              spellCheck="false"
              className="relative block w-full h-48 p-3 bg-transparent text-gray-900
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none
                         font-mono text-base leading-relaxed z-10 overflow-y-scroll"
            />
          </div>
           {/* Bottom Controls for Input */}
          <div className="flex justify-between items-center mt-2 text-sm">
            <div className="text-gray-500 space-x-2">
              <span>{inputCharCount} символов</span>
              {invisibleCharCount > 0 && (
                 <span className="text-orange-600 font-medium">
                   | {invisibleCharCount} {getPluralInvisibleSymbol(invisibleCharCount)}
                 </span>
              )}
            </div>
             <div className="flex space-x-2">
                <button
                    onClick={handleCleanText}
                    disabled={!inputText}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                  <LuX className="-ml-1 mr-2 h-4 w-4" />
                  Очистить текст
                </button>
                 <button
                    onClick={() => handleCopyToClipboard(inputText, 'input')}
                    disabled={!inputText}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isInputCopied ? <LuClipboardCheck className="h-4 w-4 text-green-500" /> : <LuClipboardCopy className="h-4 w-4" />}
                     <span className="ml-2">Копировать</span>
                </button>
             </div>
          </div>
        </div>

        {/* Output Area */}
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Очищенный текст
        </h2>
        <div className="mb-6">
           <div className="bg-gray-50 rounded-lg border border-gray-300 shadow-sm relative">
            <textarea
              id="output-text"
              value={cleanedText}
              readOnly
              placeholder="Здесь появится очищенный текст..."
              className="block w-full h-48 p-3 rounded-lg bg-gray-50 font-mono text-base leading-relaxed resize-none"
            />
             <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                 {cleanedCharCount} символов
             </div>
             <button
                onClick={() => handleCopyToClipboard(cleanedText, 'output')}
                disabled={!cleanedText}
                aria-label="Копировать очищенный текст"
                className="absolute top-2 right-2 p-1.5 border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <LuClipboardCopy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        Built with love ❤️
      </footer>
      <Toaster position="bottom-center" /> {/* Добавляем контейнер для тостов */}
    </div>
  );
}

export default App;
