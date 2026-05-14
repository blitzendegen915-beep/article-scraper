'use client';

import { useState } from 'react';

export function EmailSignup() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="mt-16 mb-8 text-center">
      <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
        <div className="text-4xl mb-3">📱</div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">
          iPhone版を準備中です
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          リリース時にお知らせします。メールアドレスを登録しておきましょう。
        </p>
        {submitted ? (
          <div className="text-green-600 dark:text-green-400 font-semibold">
            ✅ 登録しました！リリースをお待ちください。
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              登録
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
