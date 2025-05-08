"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import apiClient from '@/lib/apiClient';
import { PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface AutoReplyRule {
  _id: string;
  keyword: string;
  replyMessage: string;
  matchType: 'exact' | 'contains' | 'startsWith' | 'regex';
  caseSensitive: boolean;
  enabled: boolean;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

interface AutoReplyFormProps {
  rule?: AutoReplyRule | null;
  onSave: (rule: AutoReplyRule) => void;
  onCancel: () => void;
}

const AutoReplyForm: React.FC<AutoReplyFormProps> = ({ rule, onSave, onCancel }) => {
  const [keyword, setKeyword] = useState(rule?.keyword || '');
  const [replyMessage, setReplyMessage] = useState(rule?.replyMessage || '');
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'startsWith' | 'regex'>(rule?.matchType || 'contains');
  const [caseSensitive, setCaseSensitive] = useState(rule?.caseSensitive || false);
  const [enabled, setEnabled] = useState(rule?.enabled !== undefined ? rule.enabled : true);
  const [priority, setPriority] = useState(rule?.priority || 0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!keyword.trim() || !replyMessage.trim()) {
      setError("الكلمة المفتاحية ورسالة الرد مطلوبان.");
      setIsLoading(false);
      return;
    }

    const payload = {
      keyword,
      replyMessage,
      matchType,
      caseSensitive,
      enabled,
      priority
    };

    try {
      let response;
      if (rule && rule._id) {
        response = await apiClient.put(`/autoreplies/${rule._id}`, payload);
      } else {
        response = await apiClient.post('/autoreplies', payload);
      }
      onSave(response.data.autoReply);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل حفظ القاعدة.');
      console.error("Error saving auto-reply rule:", err);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{rule ? 'تعديل قاعدة رد تلقائي' : 'إنشاء قاعدة رد تلقائي جديدة'}</h3>
        {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}
        
        <div className="mb-3">
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الكلمة المفتاحية/العبارة</label>
          <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
        </div>

        <div className="mb-3">
          <label htmlFor="replyMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">رسالة الرد</label>
          <textarea id="replyMessage" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">نوع المطابقة</label>
          <select id="matchType" value={matchType} onChange={(e) => setMatchType(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white">
            <option value="contains">تحتوي على</option>
            <option value="exact">مطابقة تامة</option>
            <option value="startsWith">تبدأ بـ</option>
            <option value="regex">تعبير نمطي (Regex)</option>
          </select>
        </div>

        <div className="mb-3 flex items-center">
          <input type="checkbox" id="caseSensitive" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:bg-gray-700" />
          <label htmlFor="caseSensitive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">حساسية حالة الأحرف</label>
        </div>

        <div className="mb-3 flex items-center">
            <button type="button" onClick={() => setEnabled(!enabled)} className={`p-1 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                {enabled ? <ToggleRight size={24} className="text-white" /> : <ToggleLeft size={24} className="text-gray-500 dark:text-gray-400" />}
            </button>
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">مفعلة</label>
        </div>

        <div className="mb-4">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الأولوية (رقم أقل = أولوية أعلى)</label>
          <input type="number" id="priority" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
        </div>

        <div className="flex justify-end space-x-3 space-x-reverse">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" disabled={isLoading}>إلغاء</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50" disabled={isLoading}>{isLoading ? 'جاري الحفظ...' : 'حفظ القاعدة'}</button>
        </div>
      </form>
    </div>
  );
};

const AutoRepliesPage = () => {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/autoreplies');
      setRules(response.data.autoReplies || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل تحميل قواعد الرد التلقائي.');
      console.error("Error fetching auto-reply rules:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = (savedRule: AutoReplyRule) => {
    if (editingRule) {
      setRules(rules.map(r => r._id === savedRule._id ? savedRule : r));
    } else {
      setRules([...rules, savedRule]);
    }
    setShowForm(false);
    setEditingRule(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذه القاعدة؟")) return;
    try {
      await apiClient.delete(`/autoreplies/${ruleId}`);
      setRules(rules.filter(r => r._id !== ruleId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل حذف القاعدة.');
      console.error("Error deleting rule:", err);
    }
  };

  const handleEditRule = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleAddNewRule = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center">جاري تحميل قواعد الردود التلقائية...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">إدارة الردود التلقائية</h1>
        <button 
          onClick={handleAddNewRule}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusCircle size={20} className="ml-2" /> إضافة قاعدة جديدة
        </button>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">خطأ: {error}</p>}

      {showForm && (
        <AutoReplyForm 
          rule={editingRule}
          onSave={handleSaveRule} 
          onCancel={() => { setShowForm(false); setEditingRule(null); }}
        />
      )}

      {rules.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 dark:text-gray-400">لا توجد قواعد رد تلقائي معرفة حالياً.</p>
      )}

      {rules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الكلمة المفتاحية</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">رسالة الرد</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نوع المطابقة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rules.map((rule) => (
                <tr key={rule._id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{rule.keyword}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">{rule.replyMessage}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{rule.matchType}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.enabled ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                      {rule.enabled ? 'مفعلة' : 'معطلة'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                    <button onClick={() => handleEditRule(rule)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteRule(rule._id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AutoRepliesPage;

